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
    age: { type: "number", maximum: 150, minimum: 18 },
    gender: { type: "string", enum: ['male','female','others'] },
    fav_food_type: { type: "string", enum: ['chinese','indian','arabic'] },
    fav_food_content: { type: "string", enum: ['rice','non-rice'] },
    lat: { type: "number" },
    lon: { type: "number" }
  },
  required: ["name","age", "gender", "fav_food_type", "fav_food_content", "lat", "lon"],
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
    age: { type: "number", maximum: 150, minimum: 18 },
    gender: { type: "string", enum: ['male','female','others'] },
    fav_food_type: { type: "string", enum: ['chineese','indian','arabic'] },
    fav_food_content: { type: "string", enum: ['rice','non-rice'] },
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
      } else {
        req.temp_user[key] = value
      }
    }

    next();
  }
}

module.exports = {
  validateProfileStep1,
  validateProfileUpdate
};