const redis = require('../../../services/redis_db');

function redisHealthCheck(req, res, next) {
  if (redis.IsReady) {
    req.redis = "Connection successfull"
    req.code_redis = 200
    next();
  } else {
    req.redis = "Connection unsuccessfull"
    req.code_redis = 500
    next();
  }
}

module.exports = {
  redisHealthCheck
};