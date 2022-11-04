const Ajv = require("ajv")
const addFormats = require("ajv-formats")
const ajv = new Ajv()
addFormats(ajv)

// Response
const { resp } = require("../data/response");

// Validate Profile Step 1
const schemaProfileStep1 = {
  type: "object",
  properties: {
    name: { type: "string", maxLength: 150, minLength: 2 },
    lat: { type: "number" },
    lon: { type: "number" }
  },
  required: ["name", "lat", "lon"],
  additionalProperties: false,
}

const profileStep1 = ajv.compile(schemaProfileStep1)

async function validateProfileStep1(req, res, next) {
  const valid = profileStep1(req.body)
  if (!valid) {
    return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null })
  } else {

    for (let [key, value] of Object.entries(req.body)) {
      req.temp_user[key] = value
    }

    if (req.body.lat && req.body.lon) {
      if (!(req.body.lat >= -90.0 && req.body.lat <= 90.0 && req.body.lon >= -180.0 && req.body.lon <= 180.0)) {
        return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null })
      } else {
        req.temp_user.geojson.coordinates = [req.body.lon, req.body.lat]
      }
    }else{
      return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null })
    }

    req.temp_user.profile_completion = 1
    next();
  }
}

// Validate update
const schemaUpdateValidate = {
  type: "object",
  properties: {
    name: { type: "string", maxLength: 150, minLength: 2 },
    lat: { type: "number" },
    lon: { type: "number" }
  },
  additionalProperties: false
}

const updateValidate = ajv.compile(schemaUpdateValidate)

function validateProfileUpdate(req, res, next) {
  const valid = updateValidate(req.body)
  if (!valid) {
    return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null })
  } else {

    if (Object.keys(req.body).length == 0) {
      return res.status(200).json({ "response_code": 200, "message": resp["nothing-to-update"], "response": null })
    }

    if (req.body.lat && req.body.lon) {
      if (!(req.body.lat >= -90.0 && req.body.lat <= 90.0 && req.body.lon >= -180.0 && req.body.lon <= 180.0)) {
        return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null })
      } else {
        req.temp_user.geojson.coordinates = [req.body.lon, req.body.lat]
      }
    }

    for (let [key, value] of Object.entries(req.body)) {
      if (key == 'lat' || key == 'lon') {
        continue;
      }  else {
        req.temp_user[key] = value
      }
    }

    next();
  }
}

// Validate Payment Info
const schemaPaymentValidate = {
  type: "object",
  properties: {
    payment_id: { type: "string", maxLength: 256, minLength: 2 },
    signature: { type: "string", maxLength: 500, minLength: 2 },
    order_id: { type: "string", maxLength: 24, minLength: 24 }
  },
  additionalProperties: false,
  required: ['payment_id', 'signature', 'order_id']
}

const paymentValidate = ajv.compile(schemaPaymentValidate)

function paymentValidator(req, res, next) {
  const valid = paymentValidate(req.body)
  if (!valid) {
    return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null })
  } else {
    next();
  }
}

// Validate Payment Info
const schemaDBValidate = {
  type: "object",
  properties: {
    id: { type: "string", maxLength: 24, minLength: 24 },
    is_blocked: { type: "boolean" }
  },
  additionalProperties: false,
  required: ['id', 'is_blocked']
}

const dBValidate = ajv.compile(schemaDBValidate)

function validateDeliveryBlock(req, res, next) {
  const valid = dBValidate(req.body)
  if (!valid) {
    return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null })
  } else {
    next();
  }
}

module.exports = {
  validateProfileStep1,
  validateProfileUpdate,
  paymentValidator,
  validateDeliveryBlock
};