const amqp = require('amqplib/callback_api');
require('dotenv').config();

const user = require('../models/user');

var ch = null;
amqp.connect(process.env.RABBITMQ_URL, function (err, conn) {
   if (err) {
      console.log('Rabbitmq connection failed : ' + err)
   }else{
      conn.createChannel(function (err, channel) {
         if (err) {
            console.log('Rabbitmq create channel failed : ' + err)
         } else {
            ch = channel;
            ch.assertQueue('job-notification-users-fetch')
            ch.assertQueue('job-notification-consume')
            listen()
            console.log('Rabbitmq connected successfully')
         }
      });
   }
});

const listen = () => {
   ch.consume('job-notification-users-fetch', async (msg) => {
      let job_data = JSON.parse(msg.content.toString())
      let truthy = await fetchRelatedUsers(job_data)
      if (!truthy.truthy) {
         await ch.sendToQueue('job-notification-users-fetch', Buffer.from(msg.content.toString()), { persistent: true });
      } else {
         let data = truthy.data
         data.forEach(element => {
            let dat = {}
            dat.id = element._id
            dat.notification_title = 'New job vacancy 👀'
            dat.notification_type = 'info'
            dat.notification_route = 'job'
            dat.notification_route_id = job_data._id
            dat.notification_img = job_data.image
            dat.notification_message = 'New job vacancy for '+job_data.job_type.label+' at '+job_data.shop_name
            ch.sendToQueue('job-notification-consume', Buffer.from(JSON.stringify(dat)), { persistent: true })
            console.log('Message enqueued for : '+dat.id)
         });
      }
   },
      { noAck: true }
   );
}

const fetchRelatedUsers = async (data) => {

   return new Promise(async (resolve, reject) => {
      user.find({ preferred_jobs: { $in: [data.job_type] }, geojson: { $near: { $geometry: { type: "Point", coordinates: data.geojson.coordinates }, $maxDistance: 300 } }, is_blocked: false, user_ready: true, profile_completion: 4, account_type: 'user' }, { _id: 1 })
         .lean()
         .then(async (data) => {
            let data_new = {}
            data_new.data = data
            data_new.truthy = true
            resolve(data_new)
         })
         .catch(err => {
            console.log(err);
            let data_new = {}
            data_new.data = null
            data_new.truthy = false
            resolve(data_new)
         })
   })
}

const publishToQueue = async (queueName, data) => {
   return new Promise(async (resolve, reject) => {
     if(ch == null){
      console.log('publish error')
       resolve(false)
     }else{
       await ch.sendToQueue(queueName, Buffer.from(data), {persistent: true});
       resolve(true)
     }
   })
 }

process.on('exit', (code) => {
   ch.close();
   console.log(`Closing rabbitmq channel`);
});

module.exports = publishToQueue;