const express = require('express');
const router = express.Router();
var os = require('os');

// Database connectivity validator middleware
const { mongoHealthCheck } = require("./middlewares/mongodb");
const { redisHealthCheck } = require("./middlewares/redis");

// Response
const { resp } = require("./data/response");

//Routes
router.get('/', mongoHealthCheck, redisHealthCheck, async (req, res) => {

  return res.status(200).json({ "response_code": 200, "message": resp[200], "response" : { "database": req.mongodb, "database_code": req.code_mongodb, "cache_database": req.redis, "cache_database_code": req.code_redis, "version": "1.0", "hostname": os.hostname() } });
});

module.exports = router;