const mongoose = require('../../../services/mongo_db');
const menu = require('../../../models/menu');
const user = require('../../../models/user');
var axios = require('axios');
var cron = require('node-cron');
require('dotenv').config();

// Response
const { resp } = require("../data/response");

function menuFetch(req, res, next) {

  menu.find({ quantity: { $gt: 0 }, donated: false, geojson: { $near: { $geometry: { type: "Point", coordinates: req.temp_user.geojson.coordinates }, $maxDistance: (500 * 1000) } } }, {}, { /*sort: '-created_at'*/ })
    .limit(req.query.limit * 1)
    .skip((req.query.page - 1) * req.query.limit)
    .populate('owner', ['_id', 'name'])
    .lean()
    .then(async (data) => {
      let total_documents = await menu.countDocuments({ quantity: { $gt: 0 }, geojson: { $geoWithin: { $centerSphere: [req.temp_user.geojson.coordinates, ((500) / 1.60934) / 3963.2] } } })
      let total_pages = Math.ceil(total_documents / req.query.limit)
      req.total = total_documents
      req.total_pages = total_pages
      req.temp_menu = data
      return next()
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

function menuRecommendedFetch(req, res, next) {

  menu.find({ quantity: { $gt: 0 }, donated: false, food_type: req.temp_user.fav_food_type, geojson: { $near: { $geometry: { type: "Point", coordinates: req.temp_user.geojson.coordinates }, $maxDistance: (500 * 1000) } } }, {}, { /*sort: '-created_at'*/ })
    .limit(req.query.limit * 1)
    .skip((req.query.page - 1) * req.query.limit)
    .populate('owner', ['_id', 'name'])
    .lean()
    .then(async (data) => {
      let total_documents = await menu.countDocuments({ quantity: { $gt: 0 }, food_type: req.temp_user.fav_food_type, geojson: { $geoWithin: { $centerSphere: [req.temp_user.geojson.coordinates, ((500) / 1.60934) / 3963.2] } } })
      let total_pages = Math.ceil(total_documents / req.query.limit)
      req.total = total_documents
      req.total_pages = total_pages
      req.temp_menu = data
      return next()
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

function multipleMenuFetch(req, res, next) {

  menu.find({ _id: { $in: req.body.ids } }, {}, {})
    .populate('owner', ['_id', 'name'])
    .lean()
    .then(async (data) => {
      req.temp_menu = data
      return next()
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

function menuFetchAll(req, res, next) {

  menu.find({ owner: req.temp_user._id }, {}, { sort: '-created_at' })
    .lean()
    .then(async (data) => {
      req.temp_data = data
      return next()
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

function menuFetchSpecific(req, res, next) {

  menu.findOne({ _id: req.body.id })
    .then(async (data) => {
      if (data == null) {
        return res.status(200).json({ "response_code": 404, "message": "Menu not found.", "response": null });
      }
      req.temp_data = data
      return next()
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

function donateMenu(req, res, next) {

  menu.updateMany({ owner: req.temp_user._id }, { donated: true })
    .then(async (data) => {
      req.temp_user.donated = true
      req.temp_user.save().catch(err => console.log(err))
      let new_data = await user.find({ geojson: { $near: { $geometry: { type: "Point", coordinates: req.temp_user.geojson.coordinates }, $maxDistance: (100 * 1000) } } }).lean()
      res.status(200).json({ "response_code": 200, "message": resp[200], "response": null });
      const headers = {
        "Content-Type": "application/json",
        "Authorization": "key=" + process.env.FIREBASE_TOKEN
      }
      let data_push
      for (let j = 0; j < new_data.length; j++) {
        let fcms = []
        new_data[j].device.forEach(element => {
          fcms.push(element.fcm)
        });
        data_push = {
          notification: {
            title: "New donation available ✨",
            body: "Checkout latest donation from a hotel near you 🗺️"
          },
          registration_ids: fcms,
          priority: 'high'
        }
        await axios.post("https://fcm.googleapis.com/fcm/send", data_push, { headers: headers }).catch((error) => { console.log("error")})
        console.log("Messaged user "+(j + 1).toString())
      }
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

function donationsGet(req, res, next) {

  user.find({ donated: true }).lean()
    .then(async (data) => {
      for (let i = 0; i < data.length; i++) {
        data[i].device = undefined
        let temp_data = await menu.find({ owner: data[i]._id, donated: true })
        data[i].donated_items = temp_data
      }
      return res.status(200).json({ "response_code": 200, "message": resp[200], "response": data });
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

cron.schedule('59 23 * * *', () => {
  console.log('Running daily inverter cron at : ' + (new Date()).toString());
  menu.updateMany({}, [
    {
      "$set": {
        "quantity": "$per_day_quantity",
        "donated": false
      }
    }
  ])
    .then((data) => {
      console.log("Done changing menu")
    })
    .catch(err => {
      console.log("Errored while changing menu")
      console.log(err);
    })

    user.updateMany({}, [
      {
        "$set": {
          "donated": false
        }
      }
    ])
      .then((data) => {
        console.log("Done changing admins")
      })
      .catch(err => {
        console.log("Errored while changing admins")
        console.log(err);
      })
});

module.exports = {
  menuFetch,
  menuRecommendedFetch,
  multipleMenuFetch,
  menuFetchAll,
  menuFetchSpecific,
  donateMenu,
  donationsGet
};