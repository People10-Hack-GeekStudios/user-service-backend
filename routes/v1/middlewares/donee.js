const mongoose = require('../../../services/mongo_db')
const user = require('../../../models/user')
const delivery_user = require('../../../models/delivery_user')
const moment = require('moment')

// Response
const { resp } = require("../data/response");

// Token middleware
const { sendToOtherUserNotification } = require("./contact");

function validateUserByID(req, res, next) {

  user.findById(req.token.id)
    .then(data => {
      if (data == null) {
        return res.status(200).json({ "response_code": 404, "message": resp["account-not-found"], "response": null });
      } else {
        if(data.is_blocked){
          return res.status(200).json({ "response_code": 403, "message": resp["you-are-blocked"], "response": null });
        }
        if(data.account_type != 'donee'){
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

function validateDeliveryUserByID(req, res, next) {

  delivery_user.findById(req.token.id)
    .then(data => {
      if (data == null) {
        return res.status(200).json({ "response_code": 404, "message": resp["account-not-found"], "response": null });
      } else {
        req.temp_user = data;
        next();
      }
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

function validateAdminUserByID(req, res, next) {

  user.findById(req.token.id)
    .then(data => {
      if (data == null) {
        return res.status(200).json({ "response_code": 404, "message": resp["account-not-found"], "response": null });
      } else {
        if(data.is_blocked){
          return res.status(200).json({ "response_code": 403, "message": resp["you-are-blocked"], "response": null });
        }
        if(data.account_type != 'admin'){
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

async function addViewIfNotPresent(req, res, next) {

  if (req.other_user.profile_viewed_by.includes(req.temp_user._id.toString())) {
    return next();
  }

  req.other_user.profile_viewed_by.push(req.temp_user._id)
  req.temp_user.profiles_viewed.push(req.other_user._id)

  req.other_user.markModified('profile_viewed_by')
  req.temp_user.markModified('profiles_viewed')

  const session = await mongoose.startSession()

  try {
    session.startTransaction();

    await req.other_user.save()
    await req.temp_user.save()

    await session.commitTransaction()
    req.done = true
  } catch (err) {
    console.log(err);
    await session.abortTransaction()
    req.done = false
  }

  session.endSession()
  await sendToOtherUserNotification(req, 'profile_view', 'profile', req.temp_user.name+' has viewed your profile')
  next();
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

module.exports = {
  validateUserByID,
  addViewIfNotPresent,
  formatSameUserViewData,
  formatSameUserViewDataIfPresent,
  formatSameUserViewDataFunc,
  validateDeliveryUserByID,
  validateAdminUserByID
};