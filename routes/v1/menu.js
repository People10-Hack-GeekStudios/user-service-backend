const express = require('express');
const router = express.Router();

const menu = require('../../models/menu');

// Global validator middleware
const { pageValidator, multipleIdValidator, idValidator, idQuantValidator } = require("./middlewares/validator");

// Database connectivity validator middleware
const { mongoDBping } = require("./middlewares/mongodb");

// User middleware
const { validateUserByID, validateAdminUserByID } = require("./middlewares/user");

// Token middleware
const { verifyAccessToken } = require("./middlewares/token");

// Contact middleware
// const rabbitmq = require('../../services/rabbitmq');

// Job middleware
const { menuFetch, menuRecommendedFetch, multipleMenuFetch, menuFetchAll, menuFetchSpecific, donateMenu } = require("./middlewares/menu");

// Response
const { resp } = require("./data/response");

//Routes
router.get('/get', verifyAccessToken, mongoDBping, validateUserByID, pageValidator, menuFetch, async (req, res) => {

  return res.status(200).json({ "response_code": 200, "message": resp[200], "response": { "data": req.temp_menu, "total_pages": req.total_pages, "total": req.total, "current_page": req.query.page } });
});

router.get('/get-admin', verifyAccessToken, mongoDBping, validateAdminUserByID, menuFetchAll, async (req, res) => {

  return res.status(200).json({ "response_code": 200, "message": resp[200], "response": { "data": req.temp_data } });
});

router.post('/get-specific-admin', verifyAccessToken, mongoDBping, validateAdminUserByID, idValidator, menuFetchSpecific, async (req, res) => {

  return res.status(200).json({ "response_code": 200, "message": resp[200], "response": { "data": req.temp_data } });
});

router.post('/update-specific-admin', verifyAccessToken, mongoDBping, validateAdminUserByID, idQuantValidator, menuFetchSpecific, async (req, res) => {

  req.temp_data.per_day_quantity = parseInt(req.body.quantity)

  req.temp_data.save()
    .then(data => {
      return res.status(200).json({ "response_code": 200, "message": resp[200], "response": null });
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
});

router.post('/get/specific', verifyAccessToken, mongoDBping, validateUserByID, multipleIdValidator, multipleMenuFetch, async (req, res) => {

  return res.status(200).json({ "response_code": 200, "message": resp[200], "response": { "data": req.temp_menu } });
});

router.get('/get/recommended', verifyAccessToken, mongoDBping, validateUserByID, pageValidator, menuRecommendedFetch, async (req, res) => {

  return res.status(200).json({ "response_code": 200, "message": resp[200], "response": { "data": req.temp_menu, "total_pages": req.total_pages, "total": req.total, "current_page": req.query.page } });
});

router.get('/donate', verifyAccessToken, mongoDBping, validateAdminUserByID, donateMenu)

module.exports = router;