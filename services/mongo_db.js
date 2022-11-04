require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB connect function
const mongo_connector = async function (mongoose) {
  await mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true, maxPoolSize: 150 })
    .then(() => {
      console.log("MongoDB Connected");
      return (false);
    }).catch((e) => {
      throw e
    });
}

// Delay calculator for failed DB connection attempts
async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// MongoDB connection function caller
const mongo_init = async function (mongoose) {
  mongoose.pingRunner = true;
  var con_flag = true;
  var loop = 0;
  var wait_time = 1000;

  while (con_flag) {
    await mongo_connector(mongoose)
      .then(async () => {
        d = new Date();
        curr_date = d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
        console.log(curr_date);
        con_flag = false;
      }).catch(async (e) => {
        console.log(e);
        console.log("Retrying MongoDB Connection in " + (wait_time / 1000) + "s...");
        await sleep(wait_time);
        wait_time += 1000;
        con_flag = true;
        loop += 1;
        if (loop > 6) {
          try {
            console.log("Maximum retries reached, Aborting retry...");
            d = new Date();
            curr_date = d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
            console.log(curr_date);
            mongoerror_mail("geekstudiosinfo@gmail.com", process.env.APPLICATION, curr_date);
          } finally {
            con_flag = false;
          }
        }
      })
  }
  mongoose.pingRunner = false;
}

mongo_init(mongoose);
mongoose.mongo_init = mongo_init;
module.exports = mongoose;