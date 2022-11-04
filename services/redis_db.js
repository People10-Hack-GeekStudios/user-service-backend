require('dotenv').config();
var Redis = require('ioredis');

const redis = new Redis({
  port: process.env.REDIS_PORT,
  host: process.env.REDIS_HOST,
  family: 4,
  password: process.env.REDIS_PASS,
  db: process.env.REDIS_DB,
  lazyConnect: true,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});
redis.IsReady = false;

redis.on('connect', function (err, res) {
  redis.IsReady = true;
  console.log('Redis connected')
});

redis.on('error', function (err) {
  redis.IsReady = false;
  console.log('Redis connection failed : ' + err)
});

redis.call("PING")

module.exports = redis;