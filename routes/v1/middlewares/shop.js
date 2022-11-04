const mongoose = require('../../../services/mongo_db')
const user = require('../../../models/user')
const delivery_user = require('../../../models/delivery_user')
const moment = require('moment')

// Response
const { resp } = require("../data/response");

function validateUserByID(req, res, next) {

  user.findById(req.token.id)
    .then(data => {
      if (data == null) {
        return res.status(200).json({ "response_code": 404, "message": resp["account-not-found"], "response": null });
      } else {
        if (data.is_blocked) {
          return res.status(200).json({ "response_code": 403, "message": resp["you-are-blocked"], "response": null });
        }
        if (data.account_type != 'admin') {
          return res.status(200).json({ "response_code": 400, "message": resp["action-cannot-performed"], "response": null });
        }
        req.temp_user = data;
        req.temp_user.updation_ip = req.ip
        next();
      }
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

function formatSameUserViewData(req, res, next) {
  req.temp_user.device = undefined;
  req.temp_user.creation_ip = undefined;
  req.temp_user.updation_ip = undefined;
  req.temp_user.__v = undefined;
  // req.temp_user.created_at = undefined;
  // req.temp_user.updated_at = undefined;

  next();

}

function formatSameUserViewDataIfPresent(req, res, next) {

  if (req.temp_user == null) {
    return next()
  }

  req.temp_user.profile_viewed_by = undefined;
  req.temp_user.blocked_by = undefined;
  req.temp_user.device = undefined;
  req.temp_user.creation_ip = undefined;
  req.temp_user.updation_ip = undefined;
  req.temp_user.__v = undefined;
  req.temp_user.created_at = undefined;
  req.temp_user.updated_at = undefined;

  next();

}

function formatSameUserViewDataFunc(data) {

  data.device = undefined;
  data.creation_ip = undefined;
  data.updation_ip = undefined;
  data.__v = undefined;
  data.created_at = undefined;
  data.updated_at = undefined;

  return data

}

function getDeliveryUsers(req, res, next) {
  delivery_user.find({ owner: req.temp_user._id }, { device: 0 })
    .lean()
    .then((data) => {
      return res.status(200).json({ "response_code": 200, "message": resp[200], "response": data });
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

function blockDeliveryUser(req, res, next) {
  delivery_user.findById(req.body.id)
    .then((data) => {
      if (data == null) {
        return res.status(200).json({ "response_code": 404, "message": resp[404], "response": data });
      } else {
        data.is_blocked = req.body.is_blocked
        data.save()
          .then(new_data => {
            return res.status(200).json({ "response_code": 200, "message": resp[200], "response": data });
          })
          .catch(err => {
            console.log(err);
            return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
          })
      }
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

module.exports = {
  validateUserByID,
  formatSameUserViewData,
  formatSameUserViewDataIfPresent,
  formatSameUserViewDataFunc,
  getDeliveryUsers,
  blockDeliveryUser
};