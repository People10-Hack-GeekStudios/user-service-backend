const express = require('express');
require('dotenv').config();
const razorpay = require('razorpay');
const crypto = require('crypto');
const router = express.Router();
var user = require("../../models/user");
const mongoose = require('../../services/mongo_db');

// Validator middleware
const { paymentValidator } = require("./middlewares/shop_validator");

// Database connectivity validator middleware
const { mongoDBping } = require("./middlewares/mongodb");

// User middleware
const { validateUserByID } = require("./middlewares/user");

// Order middleware
const { fetchOrder } = require("./middlewares/order");

// Token middleware
const { verifyAccessToken } = require("./middlewares/token");

// Response
const { resp } = require("./data/response");

//Instantiate Razorpay
const razorpay_inst = new razorpay({

  key_id: process.env.RAZORPAY_ID,
  key_secret: process.env.RAZORPAY_SECRET
});

router.use(verifyAccessToken, mongoDBping, validateUserByID)

//Routes
router.post('/verify/order', paymentValidator, fetchOrder, (req, res) => {

  if (req.order.payment.is_completed) {
    return res.status(200).json({ "response_code": 200, "message": "Payment already completed.", "response": null });
  }

  let hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET)
  hmac.update(req.order.payment.order_id + "|" + req.body.payment_id)
  const generated_signature = hmac.digest('hex')

  if (req.body.signature === generated_signature) {
    req.order.payment.payment_id = req.body.payment_id
    req.order.payment.signature = req.body.signature
    req.order.payment.status = 'success'
    req.order.payment.is_completed = true
    req.order.payment_completed = true
    req.order.save()
      .then((data) => {
        return res.status(200).json({ "response_code": 200, "message": "Payment successfull.", "response": null });
      })
      .catch(err => {
        console.log(err)
        return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
      })
  } else {
    req.order.payment.status = 'failed'
    req.order.payment.payment_id = req.body.payment_id
    req.order.payment.signature = req.body.signature
    req.order.save()
      .then((data) => {
        return res.status(200).json({ "response_code": 400, "message": "Invalid payment.", "response": null });
      })
      .catch(err => {
        console.log(err)
        return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
      })
  }

})

module.exports = router;