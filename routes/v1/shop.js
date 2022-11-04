const express = require('express');
const router = express.Router();
var user = require("../../models/user");
const mongoose = require('../../services/mongo_db');

// Validator middleware
const { validateProfileStep1, validateProfileUpdate, validateDeliveryBlock } = require("./middlewares/shop_validator");

// Database connectivity validator middleware
const { mongoDBping } = require("./middlewares/mongodb");

// Shop middleware
const { validateUserByID, formatSameUserViewData, formatSameUserViewDataFunc, getDeliveryUsers, blockDeliveryUser } = require("./middlewares/shop");

// Token middleware
const { verifyAccessToken } = require("./middlewares/token");

// Response
const { resp } = require("./data/response");

//Routes
router.get('/get/', verifyAccessToken, mongoDBping, validateUserByID, formatSameUserViewData, async (req, res) => {

  return res.status(200).json({ "response_code": 200, "message": resp[200], "response": { "profile_completion": req.temp_user.profile_completion, "user": req.temp_user } });
});

router.post('/complete/1/', verifyAccessToken, mongoDBping, validateUserByID, validateProfileStep1, async (req, res) => {

  req.temp_user.save()
    .then(data => {
      data = formatSameUserViewDataFunc(data)
      return res.status(200).json({ "response_code": 200, "message": resp["prof-step-1"], "response": { "profile_completion": data.profile_completion, "user": data } });
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
});

router.post('/update', verifyAccessToken, mongoDBping, validateUserByID, validateProfileUpdate, async (req, res) => {

  req.temp_user.save()
    .then(data => {
      data = formatSameUserViewDataFunc(data)
      return res.status(200).json({ "response_code": 200, "message": resp["prof-updated"], "response": { "user": data } });
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
});

router.get('/delivery/users', verifyAccessToken, mongoDBping, validateUserByID, getDeliveryUsers);

router.post('/delivery/users/block', verifyAccessToken, mongoDBping, validateUserByID, validateDeliveryBlock, blockDeliveryUser);

module.exports = router;