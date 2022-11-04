const mongoose = require('../../../services/mongo_db');

// Response
const { resp } = require("../data/response");

function mongoDBping(req, res, next) {
  const num = mongoose.connection.readyState;
  if (num == 1) {
    next();
  } else {
    if (!mongoose.pingRunner) { mongoose.mongo_init(mongoose); }
    console.log("MongoDB not connected error");
    return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
  }
}

function mongoHealthCheck(req, res, next) {
  const num = mongoose.connection.readyState;
  if (num == 1) {
    req.mongodb = "Connection successfull"
    req.code_mongodb = 200
    next();
  } else {
    req.mongodb = "Connection unsuccessfull"
    req.code_mongodb = 500
    next();
  }
}

module.exports = {
  mongoDBping,
  mongoHealthCheck
};