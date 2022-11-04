const jwt = require('jsonwebtoken');
const redis = require('../../../services/redis_db');
require('dotenv').config();

// Response
const { resp } = require("../data/response");

function verifyAccessToken(req, res, next) {

  if (redis.IsReady) {

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.status(200).json({ "response_code": 403, "message": resp[403], "response": null })

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) return res.status(401).json({ "response_code": 401, "message": resp["invalid-token"], "response": null })
      redis.get(user.id + '-' + user.device_id + '-token')
        .then((data) => {

          if (data != null && data == token) {
            req.token = user
            next()
          } else {
            return res.status(401).json({ "response_code": 401, "message": resp["expired-token"], "response": null })
          }

        })
        .catch(error => {
          console.log(error);
          return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
        })
    })

  } else {
    console.log("Redis not connected error");
    return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
  }
}

function verifyAccessTokenIfPresent(req, res, next) {

  if (redis.IsReady) {

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) { req.token = null; return next() }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) { req.token = null; return next() }
      redis.get(user.id + '-' + user.device_id + '-token')
        .then((data) => {

          if (data != null && data == token) {
            req.token = user
            next()
          } else {
            req.token = null
            next()
          }

        })
        .catch(error => {
          console.log(error);
          return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
        })
    })

  } else {
    console.log("Redis not connected error");
    return res.status(200).json({ "response_code": 500, "message": resp[500], "response": null });
  }
}

function createAdminToken() {

  return new Promise(async (resolve, reject) => {
    let accesstoken = jwt.sign({ id: 'admin' }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' })
    await cacheAdminToken(accesstoken)
    resolve(accesstoken)
  })
}

function cacheAdminToken(accesstoken) {

  return new Promise(async (resolve, reject) => {
    redis.set('admin-token', accesstoken, 'ex', 86400)
      .then((reply) => {
        resolve()
      })
  })
}

function getAdminToken() {

  return new Promise(async (resolve, reject) => {
    redis.get('admin-token')
      .then(async (reply) => {
        if (reply == null) {
          let token = await createAdminToken()
          resolve(token)
        }
        resolve(reply);
      })
  })
}

function verifyAdminAccessToken(req, res, next) {

  if (redis.IsReady) {

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.status(200).json({ "response_code": 403, "message": resp[403], "response" : null })

    jwt.verify(token, process.env.ACCESS_TOKEN_ADMIN_SECRET, (err, user) => {
      if (err) return res.status(401).json({ "response_code": 401, "message": resp["invalid-token"], "response" : null })
      redis.get(user.id + '-admin-token')
        .then((data) => {
          if (data != null && data == token && user.is_admin) {
            req.token = user
            next()
          } else {
            return res.status(401).json({ "response_code": 401, "message": resp["expired-token"], "response" : null })
          }

        })
        .catch(error => {
          console.log(error);
          return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
        })
    })

  } else {
    console.log("Redis not connected error");
    return res.status(200).json({ "response_code": 500, "message": resp[500], "response" : null });
  }
}

module.exports = {
  verifyAccessToken,
  verifyAccessTokenIfPresent,
  getAdminToken,
  verifyAdminAccessToken
};