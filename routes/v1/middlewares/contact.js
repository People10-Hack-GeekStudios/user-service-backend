require('dotenv').config();

const axios = require('axios')

function sendToOtherUserNotification(req, id, title, type, route, message) {

  return new Promise(async (resolve, reject) => {
  let profile_image
  if (req.temp_user.account_type=='shop') {
    profile_image = req.temp_user.images[0].thumbnail
  }else{
    profile_image = req.temp_user.image.thumbnail
  }
  let new_send_data = {
    id: id.toString(),
    notification_route_id: req.temp_user._id.toString(),
    notification_title: title,
    notification_type: type,
    notification_route: route,
    notification_img: profile_image,
    notification_message: message
  }
  axios.post(process.env.CONTACT_API, new_send_data)
    .then((response) => {
      resolve(true)
    })
    .catch((error) => {
      console.log(error)
      resolve(false)
    })
  })

}

function sendToUserNotification(req, id, title, type, route, message) {

  return new Promise(async (resolve, reject) => {
  let profile_image = 'https://api.jobro.in/upload/v1/cdn/assets/money.png'
  let new_send_data = {
    id: req.temp_user._id.toString(),
    notification_title: title,
    notification_route_id: id,
    notification_type: type,
    notification_route: route,
    notification_img: profile_image,
    notification_message: message
  }
  axios.post(process.env.CONTACT_API, new_send_data)
    .then((response) => {
      resolve(true)
    })
    .catch((error) => {
      console.log(error)
      resolve(false)
    })
  })

}

module.exports = {
  sendToOtherUserNotification,
  sendToUserNotification
};
