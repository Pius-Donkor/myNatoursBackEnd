const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowerCase: true,
    validate: [validator.isEmail, 'Please provide a valid Email']
  },
  //   role: {
  //     type: String,
  //     required: [true, 'Please provide a role']
  //   },
  //   active: {
  //     type: Boolean,
  //     default: true
  //   },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'admin', 'lead-guide'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    //    the validate only works on CREATE() AND SAVE()
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'passwords are not the same'
    }
  },
  changedPasswordAt: { type: Date },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// MIDDLEWARES
userSchema.pre('save', async function(next) {
  // The function can only proceed if the password is modified  example when signing up or resetting your password
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.changedPasswordAt = Date.now() - 1000;

  next();
});

userSchema.pre(/^find/, function() {
  this.find({ active: { $ne: false } });
});
// INSTANCE METHODS

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPassword = function(JWTTimeStamp) {
  // console.log(JWTTimeStamp, this);
  if (this.changedPasswordAt) {
    const changedPasswordTimeStamp = parseInt(
      this.changedPasswordAt.getTime() / 1000,
      10
    );
    return JWTTimeStamp < changedPasswordTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  // console.log('Generated Reset Token:', resetToken);
  // console.log('Hashed Token:', this.passwordResetToken);

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
