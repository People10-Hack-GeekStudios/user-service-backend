const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({

  name: {
    type: String
  },
  food_type: {
    type: String,
    enum: ['chinese','indian','arabic']
  },
  per_day_quantity: {
    type: Number
  },
  quantity: {
    type: Number
  },
  price: {
    type: Number
  },
  image: {
    type: String
  },
  owner: {
    type: mongoose.Types.ObjectId,
    ref: 'Users'
  },
  donated: {
    type: Boolean,
    default: false
  },
  geojson: {
    type: {
      type: String,
      enum: ['Point'],
      default:'Point'
    },
    coordinates: {
      type: [Number]
    }
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date
  }
})

userSchema.pre('save', async function save(next) {
  this.increment();
  this.updated_at = new Date;
  return next();
});

userSchema.index({geojson:"2dsphere"});

module.exports = mongoose.model('Menu', userSchema)