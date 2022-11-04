const mongoose = require('../../../services/mongo_db');
const razorpay = require('razorpay');
const moment = require('moment')
require('dotenv').config();

// Response
const { resp } = require("../data/response");
const order = require('../../../models/order');
const menu = require('../../../models/menu');

//Instantiate Razorpay
const razorpay_inst = new razorpay({

  key_id: process.env.RAZORPAY_ID,
  key_secret: process.env.RAZORPAY_SECRET
});

async function addOrder(req, res, next) {

  let total_amount = 0;
  let new_order = new order()
  let fetched_order_item = []
  new_order.order = []
  for (let i = 0; i < req.body.order_items.length; i++) {
    let temp_item = await menu.findById(req.body.order_items[i].id)
    if (temp_item == null) {
      return res.status(200).json({ "response_code": 400, "message": resp["food-not-found"], "response": null });
    } else {
      if (temp_item.quantity - req.body.order_items[i].quantity < 0) {
        return res.status(200).json({ "response_code": 400, "message": resp["food-quantity-less"], "response": null });
      }
      new_order.order[i] = {}
      new_order.order[i].food = temp_item._id
      new_order.order[i].owner = temp_item.owner
      new_order.order[i].quantity = req.body.order_items[i].quantity
      total_amount += (temp_item.price * req.body.order_items[i].quantity)
      temp_item.quantity -= req.body.order_items[i].quantity
      fetched_order_item.push(temp_item)
    }
  }

  new_order.amount = total_amount
  new_order.ordered_by = req.temp_user._id
  var d = new Date();

  if (req.body.delivery_time && req.body.delivery_time != null) {
    d.setMinutes(d.getMinutes() + req.body.delivery_time - 10);
  }

  new_order.order_to_be_prepared_at = d

  amount = total_amount * 100
  currency = 'INR'
  receipt = req.temp_user._id
  notes = { "description": "Order Payment." }

  razorpay_inst.orders.create({ amount, currency, receipt, notes },
    async (err, order) => {

      if (!err) {
        new_order.payment.order_id = order.id
        new_order.payment.amount = order.amount
        new_order.payment.is_completed = false

        const session = await mongoose.startSession()

        try {
          session.startTransaction();

          req.order = await new_order.save()
          for (let j = 0; j < fetched_order_item.length; j++) {
            await fetched_order_item[j].save()
          }

          await session.commitTransaction()
          req.done = true
        } catch (err) {
          console.log(err);
          await session.abortTransaction()
          req.done = false
        }

        session.endSession()

        if (req.done) {
          next()
        } else {
          return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
        }
      }
      else {
        console.log(err)
        return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
      }
    }
  )
}

const getOrder = (req, res, next) => {
  order.find({ ordered_by: req.temp_user._id }, {}, { sort: '-created_at' })
    .limit(req.query.limit * 1)
    .skip((req.query.page - 1) * req.query.limit)
    .populate('order.food')
    .populate('order.owner', ['_id', 'name'])
    .lean()
    .then(async (data) => {
      let total_documents = await order.countDocuments({ ordered_by: req.temp_user._id })
      let total_pages = Math.ceil(total_documents / req.query.limit)
      req.total = total_documents
      req.total_pages = total_pages
      req.order = data
      return next()
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

const fetchOrder = (req, res, next) => {
  order.findOne({ _id: req.body.order_id })
    .then((data) => {
      if (data == null) {
        return res.status(200).json({ "response_code": 404, "message": resp["order-not-found"], "response": null });
      }
      req.order = data
      return next()
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

const getSpecificOrder = (req, res, next) => {
  order.findOne({ _id: req.body.id })
    .then((data) => {
      if (data == null) {
        return res.status(200).json({ "response_code": 404, "message": resp["order-not-found"], "response": null });
      }
      if (data.order_status == 'delivered') {
        return res.status(200).json({ "response_code": 404, "message": "Order already delivered ❌.", "response": null });
      }
      req.order = data
      return next()
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

const getSpecificOrderReady = (req, res, next) => {
  order.findOne({ _id: req.body.id })
    .then((data) => {
      if (data == null) {
        return res.status(200).json({ "response_code": 404, "message": resp["order-not-found"], "response": null });
      }
      if (data.order_status == 'delivered' || data.order_status == 'ready') {
        return res.status(200).json({ "response_code": 404, "message": "Order already marked ready/delivered ❌.", "response": null });
      }
      req.order = data
      return next()
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

const cancelOrder = (req, res, next) => {
  order.findOne({ _id: req.body.id, ordered_by: req.temp_user._id })
    .then(async (data) => {
      if (data == null) {
        return res.status(200).json({ "response_code": 404, "message": resp["order-not-found"], "response": null });
      }
      if (data.order_status == 'delivered' || data.order_status == 'ready' || data.order_status == 'preparing') {
        return res.status(200).json({ "response_code": 404, "message": "Order already marked ready/delivered/prepared, cannot cancel the order now ❌.", "response": null });
      }
      await order.deleteOne({ _id: data._id }).catch(err => console.log(err))
      return next()
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

const todaysOrderFetch = (req, res, next) => {
  order.find({ 'order.owner': req.temp_user._id, created_at: { $gte: moment(new Date()).startOf('day').toDate(), $lte: moment(new Date()).endOf('day').toDate() } })
    .populate('order.food')
    .populate('ordered_by')
    .then(async (data) => {
      req.temp_data = data
      return next()
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

const allOrderFetch = (req, res, next) => {
  order.find({ 'order.owner': req.temp_user._id }, {}, { sort: '-created_at' })
    .populate('order.food')
    .populate('ordered_by')
    .then(async (data) => {
      req.temp_data = data
      return next()
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

const recommendOrderFetch = (req, res, next) => {
  order.find({ 'order.owner': req.temp_user._id, created_at: { $gte: moment(new Date()).subtract(7, 'days').toDate(), $lte: moment(new Date()).endOf('day').toDate() } })
    .populate('order.food')
    .then(async (data) => {
      let obj = {}
      let arr = []
      data.forEach(dat => {
        dat.order.forEach(element => {
          if (!obj[element.food._id]) {
            obj[element.food._id] = {}
            obj[element.food._id].name = element.food.name
            obj[element.food._id].image = element.food.image
            obj[element.food._id].total = 0
          }
          obj[element.food._id].total += element.quantity
        })
      })
      for (const [key, value] of Object.entries(obj)) {
        arr.push(value)
      }
      req.temp_data = arr
      return next()
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

module.exports = {
  addOrder,
  getOrder,
  fetchOrder,
  getSpecificOrder,
  getSpecificOrderReady,
  cancelOrder,
  todaysOrderFetch,
  allOrderFetch,
  recommendOrderFetch
};