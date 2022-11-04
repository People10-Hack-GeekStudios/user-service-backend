const mongoose = require('../../../services/mongo_db');
const app_config = require('../../../models/app_config');

// Response
const { resp } = require("../data/response");

function fetchAppInfo(req, res, next) {

  app_config.findOne({ user: "admin" })
    .then(data => {
      if (data == null) {
        new_app_config = new app_config()
        new_app_config.user = "admin"
        new_app_config.creation_ip = req.ip
        new_app_config.save()
          .then(data => {
            req.old_app_config = {
              ios_app_min_version: data.ios_app_min_version,
              ios_app_latest_version: data.ios_app_latest_version,
              android_app_min_version: data.android_app_min_version,
              android_app_latest_version: data.android_app_latest_version,
              new_feature_list: data.new_feature_list
            }
            req.app_config = data
            return next()
          })
          .catch(err => {
            console.log(err);
            return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
          })
      } else {
        req.old_app_config = {
          ios_app_min_version: data.ios_app_min_version,
          ios_app_latest_version: data.ios_app_latest_version,
          android_app_min_version: data.android_app_min_version,
          android_app_latest_version: data.android_app_latest_version,
          new_feature_list: data.new_feature_list
        }
        req.app_config = data
        return next()
      }
    })
    .catch(err => {
      console.log(err);
      return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
    })
}

module.exports = {
  fetchAppInfo
};