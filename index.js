require('dotenv').config();
process.env.TZ = 'Asia/Calcutta'
const express = require('express');
var cors = require('cors')
const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors())
app.set('trust proxy', 1);

const shopRoute = require('./routes/v1/shop');
app.use('/v1/shop/profile', shopRoute);

const menuRoute = require('./routes/v1/menu');
app.use('/v1/menu', menuRoute);

const orderRoute = require('./routes/v1/order');
app.use('/v1/order', orderRoute);

const paymentRoute = require('./routes/v1/payment');
app.use('/v1/payment', paymentRoute);

const userRoute = require('./routes/v1/user');
app.use('/v1/user/profile', userRoute);

const doneeRoute = require('./routes/v1/donee');
app.use('/v1/donee/profile', doneeRoute);

const healthRoute = require('./routes/v1/health');
app.use('/v1/healthcheck', healthRoute);

const server = app.listen(
  PORT,
  () => console.log(`User service is running on port : ${PORT}`)
)

require('./routes/v1/ws');