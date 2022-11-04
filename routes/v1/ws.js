const WebSocket = require('ws');
const order = require('../../models/order');
const delivery_user = require('../../models/delivery_user');
const jwt = require('jsonwebtoken');
const redis = require('../../services/redis_db');
const express = require('express');
const url = require('url');
const app = express();
require('dotenv').config();
var fs = require('fs');
var https = require('https');
const path = require("path");

var privateKey = fs.readFileSync( path.resolve(__dirname, './ssl/key.pem') );
var certificate = fs.readFileSync( path.resolve(__dirname, './ssl/cert.pem') );

var options = {
  key: privateKey,
  cert: certificate,
};

const PORT = process.env.PORT;

const server = https.createServer(options, app).listen(parseInt(PORT) + 1005, function(){
  console.log(`User service websocket is running on port ${parseInt(PORT) + 1005}`);
});

// const server = app.listen(
//   parseInt(PORT) + 1005,
//   () => console.log(`User service websocket is running on port : ${parseInt(PORT) + 1005}`)
// )

const wss = new WebSocket.Server({ server: server, path: '/' });

var wsClients = {};

function verifyAccessToken(token) {
  return new Promise((resolve, reject) => {
    if (redis.IsReady) {

      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) resolve(null)
        redis.get(user.id + '-' + user.device_id + '-token')
          .then((data) => {

            if (data != null && data == token) {
              resolve(user)
            } else {
              resolve(null)
            }

          })
          .catch(error => {
            console.log(error);
            resolve(null)
          })
      })

    } else {
      resolve(null)
    }
  })
}

function validateUserByID(id) {
  return new Promise((resolve, reject) => {
  delivery_user.findById(id).populate('owner')
    .then(data => {
      if (data == null) {
        resolve(null)
      } else {
        if (data.is_blocked) {
          resolve(null)
        }
        resolve(data)
      }
    })
    .catch(err => {
      console.log(err);
      resolve(null)
    })
  })
}

wss.on('connection', async (ws, req) => {
  var token = url.parse(req.url, true).query.token;

  var token_valid = await verifyAccessToken(token)

  if (token_valid != null) {

    var user_valid = await validateUserByID(token_valid.id)

    if(user_valid != null){
        wsClients[user_valid.owner._id] = ws;
    }else{
      ws.close();
    }

  } else {
    ws.close();
  }

  ws.on('connect', () => {
    for (const [token, client] of Object.entries(wsClients)) {
      client.send("Hello");
    }
  });

  // ws.on('message', (data) => {
  //     for (const [token, client] of Object.entries(wsClients)) {
  //         jwt.verify(token, jwtSecret, (err, decoded) => {
  //             if (err) {
  //                 client.send("Error: Your token is no longer valid. Please reauthenticate.");
  //                 client.close();
  //             } else {
  //                 client.send(wsUsername + ": " + data);
  //             }
  //         });
  //     }
  // });
});

const order_cron = async () => {
  const fetched_order = await order.find({ order_to_be_prepared_at: { $lte: new Date() }, order_status: ["created","preparing"], payment_completed: true }).populate('order.food')
  for (let i = 0; i < fetched_order.length; i++) {
    if(wsClients[fetched_order[i].order[0].owner]){
      console.log('found')
      wsClients[fetched_order[i].order[0].owner].send(JSON.stringify(fetched_order))
      fetched_order[i].order_status = 'preparing'
      await fetched_order[i].save()
    }else{
      //console.log('Not Found!')
      continue
    }
  }
  await new Promise(r => setTimeout(r, 5000));
  order_cron()
}

order_cron()