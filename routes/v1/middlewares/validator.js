const Ajv = require("ajv")
const addFormats = require("ajv-formats")
const ajv = new Ajv()
addFormats(ajv)

// Response
const { resp } = require("../data/response");

// Validate id
const schemaIdValidate = {
  type: "object",
  properties: {
    id: { type: "string", maxLength: 24, minLength: 24 }
  },
  required: ["id"],
  additionalProperties: false
}

const idValidate = ajv.compile(schemaIdValidate)

function idValidator(req, res, next) {
  const valid = idValidate(req.body)
  if (!valid) {
    return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null })
  } else {
    next();
  }
}

// Validate id
const schemaIdQuantValidate = {
  type: "object",
  properties: {
    id: { type: "string", maxLength: 24, minLength: 24 },
    quantity: { type: "number", minimum: 0, maximum: 1000 }
  },
  required: ["id","quantity"],
  additionalProperties: false
}

const idQuantValidate = ajv.compile(schemaIdQuantValidate)

function idQuantValidator(req, res, next) {
  const valid = idQuantValidate(req.body)
  if (!valid) {
    return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null })
  } else {
    next();
  }
}

function pageValidator(req, res, next) {
  if (typeof req.query.limit == 'undefined') {
    req.query.limit = 10
  } else {
    if (!Number.isInteger(parseInt(req.query.limit))) {
      return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null });
    } else if (req.query.limit < 1) {
      return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null });
    }
  }

  if (typeof req.query.page == 'undefined') {
    req.query.page = 1
  } else {
    if (!Number.isInteger(parseInt(req.query.page))) {
      return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null });
    } else if (req.query.page < 1) {
      return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null });
    }
  }

  req.query.limit = parseInt(req.query.limit)
  req.query.page = parseInt(req.query.page)
  next()
}

// Validate Order Add
const schemaOrderAdd = {
  type: "object",
  properties: {
    order_items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", maxLength: 24, minLength: 24 },
          quantity: { type: "number", maximum: 30, minimum: 1 }
        },
        required: ["id", "quantity"],
        additionalProperties: false
      },
      uniqueItems: true
    },
    delivery_time: { type: "number", maximum: 1440, minimum: 11 }
  },
  required: ["order_items"],
  additionalProperties: false
}

const orderAddValidate = ajv.compile(schemaOrderAdd)

function validateOrderAdd(req, res, next) {
  const valid = orderAddValidate(req.body)
  if (!valid) {
    return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null })
  } else {
    next();
  }
}

// Validate id
const schemaMultipleIdValidate = {
  type: "object",
  properties: {
    ids: {
      type: "array",
      items: {
        type: "string", 
        maxLength: 24, 
        minLength: 24
      },
      uniqueItems: true
    }
  },
  required: ["ids"],
  additionalProperties: false
}

const multipleIdValidate = ajv.compile(schemaMultipleIdValidate)

function multipleIdValidator(req, res, next) {
  const valid = multipleIdValidate(req.body)
  if (!valid) {
    return res.status(200).json({ "response_code": 400, "message": resp[400], "response": null })
  } else {
    next();
  }
}

module.exports = {
  idValidator,
  idQuantValidator,
  pageValidator,
  validateOrderAdd,
  multipleIdValidator
};