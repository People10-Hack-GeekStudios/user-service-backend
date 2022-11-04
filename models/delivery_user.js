const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({

  uid: {
    type: String,
    required: [true, 'is required'],
    unique: [true, 'Uid already in use'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'is required'],
    minlength: 5,
    maxlength: 200,
    validate: {
      validator: function (val) {
        var re = /^(?=.*\d)(?=.*[\s!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        if (!re.test(val)) {
          return false;
        }
        return true;
      },
      message: 'Password should be minimum 8 characters long. It should include number, uppercase, lowercase and special character.'
    }
  },
  owner: {
    type: mongoose.Types.ObjectId,
    ref: 'Users'
  },
  device: {
    type: Array
  },
  is_blocked: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date
  }
})

var ID = function () {
  return Math.random().toString(36).substring(2, 9);
};

userSchema.pre('save', async function save(next) {
  this.increment();
  this.updated_at = new Date;
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

module.exports = mongoose.model('Delivery_Users', userSchema)