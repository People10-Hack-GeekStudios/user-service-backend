const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({

  order: [{
    food: {
      type: mongoose.Types.ObjectId,
      ref: 'Menu'
    },
    owner: {
      type: mongoose.Types.ObjectId,
      ref: 'Users'
    },
    quantity: {
      type: Number
    }
  }],
  amount: {
    type: Number
  },
  payment: {
    is_completed: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['created', 'failed', 'success'],
      default: 'created'
    },
    order_id: {
      type: String
    },
    amount: {
      type: Number
    },
    payment_id: {
      type: String
    },
    signature: {
      type: String
    }
  },
  order_status: {
    type: String,
    enum: ['created', 'preparing', 'ready', 'delivered'],
    default: 'created'
  },
  order_to_be_prepared_at: {
    type: Date,
    default: Date.now
  },
  payment_completed: {
    type: Boolean,
    default: false
  },
  ordered_by: {
    type: mongoose.Types.ObjectId,
    ref: 'Users'
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

module.exports = mongoose.model('Order', userSchema)