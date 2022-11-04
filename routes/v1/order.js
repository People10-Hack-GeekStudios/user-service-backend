const express = require('express');
const router = express.Router();

const order = require('../../models/order');

// Global validator middleware
const { validateOrderAdd, pageValidator, idValidator } = require("./middlewares/validator");

// Database connectivity validator middleware
const { mongoDBping } = require("./middlewares/mongodb");

// User middleware
const { validateUserByID, validateDeliveryUserByID, validateAdminUserByID } = require("./middlewares/user");

// Token middleware
const { verifyAccessToken } = require("./middlewares/token");

// Contact middleware
// const rabbitmq = require('../../services/rabbitmq');

// Order middleware
const { addOrder, getOrder, getSpecificOrder, getSpecificOrderReady, cancelOrder, todaysOrderFetch, allOrderFetch, recommendOrderFetch } = require("./middlewares/order");

// Response
const { resp } = require("./data/response");

//Routes
router.post('/add', verifyAccessToken, mongoDBping, validateUserByID, validateOrderAdd, addOrder, async (req, res) => {

  return res.status(200).json({ "response_code": 200, "message": resp[200], "response": req.order });
});

router.get('/get', verifyAccessToken, mongoDBping, validateUserByID, pageValidator, getOrder, async (req, res) => {

  return res.status(200).json({ "response_code": 200, "message": resp[200], "response": { "data" : req.order, "total_pages": req.total_pages, "total": req.total, "current_page": req.query.page } });
});

router.post('/deliver', verifyAccessToken, mongoDBping, validateDeliveryUserByID, idValidator, getSpecificOrder, async (req, res) => {

  req.order.order_status = 'delivered'
  req.order.save()
  .then(data => {
    return res.status(200).json({ "response_code": 200, "message": "Successfully delivered the order ✅.", "response": null });
  })
  .catch(err => {
    console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
  })
});

router.post('/ready', verifyAccessToken, mongoDBping, validateDeliveryUserByID, idValidator, getSpecificOrderReady, async (req, res) => {

  req.order.order_status = 'ready'
  req.order.save()
  .then(data => {
    return res.status(200).json({ "response_code": 200, "message": "Successfully marked the order as ready ✅.", "response": null });
  })
  .catch(err => {
    console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
  })
});

router.post('/cancel', verifyAccessToken, mongoDBping, validateUserByID, idValidator, cancelOrder, async (req, res) => {

  return res.status(200).json({ "response_code": 200, "message": "Order cancelled successfully ✅.", "response": null });
});

router.get('/todays-order-admin', verifyAccessToken, mongoDBping, validateAdminUserByID, todaysOrderFetch, async (req, res) => {

  return res.status(200).json({ "response_code": 200, "message": resp[200], "response": req.temp_data });
});

router.get('/all-order-admin', verifyAccessToken, mongoDBping, validateAdminUserByID, allOrderFetch, async (req, res) => {

  return res.status(200).json({ "response_code": 200, "message": resp[200], "response": req.temp_data });
});

router.get('/recommended-order-admin', verifyAccessToken, mongoDBping, validateAdminUserByID, recommendOrderFetch, async (req, res) => {

  return res.status(200).json({ "response_code": 200, "message": resp[200], "response": req.temp_data });
});

module.exports = router;