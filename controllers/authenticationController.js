const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('../utils/email');

const signupToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, status, req, res) => {
  const token = signupToken(user._id);

  // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    // testing for secure connections
    secure: req.secure || req.headers['x-forwarded-proto']
  });
  // removing password from output
  user.password = undefined;

  res.status(status).json({
    status: 'success',
    token,
    data: user
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    changedPasswordAt: req.body.changedPasswordAt,
    role: req.body.role
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError('Provide an email and password', 400));
  const user = await User.findOne({ email }).select('+password');
  // console.log(user);
  if (!email || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Incorrect email or password', 401));
  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedOut', {
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000)
  });
  res.status(200).json({
    status: 'success'
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // console.log(token);

  if (!token) {
    return next(
      new AppError(
        'You are not yet logged in , Please login to get access',
        401
      )
    );
  }
  // 2)verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does not exist anymore',
        401
      )
    );
  }
  // 4) check if user changed password after the token was issued

  if (currentUser.changedPassword(decoded.iat)) {
    return next(
      new AppError('user currently changed password, Please login again', 401)
    );
  }
  req.user = currentUser;
  res.locals.user = currentUser;

  // moving to the next middleware
  next();
});

// only for rendering pages ,

exports.isLoggedIn = async (req, res, next) => {
  // 1) Getting token and check of it's there

  if (req.cookies.jwt) {
    try {
      // 2)verification token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 3) check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      // 4) check if user changed password after the token was issued

      if (currentUser.changedPassword(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (error) {
      return next();
    }
  }
  // moving to the next middleware
  next();
};

exports.restrictTo = function(...roles) {
  return async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email !', 404));
  }
  // 2) generate random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetUrl).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'token sent to email'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email, PLease try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // console.log('Received Token from Request:', req.params.token);

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() } // Ensure token is not expired
  });

  if (!user) {
    return next(new AppError('Invalid token or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user._id).select('+password');

  if (!user)
    return next(new AppError('This user currently does not exist', 404));
  // 2) check if posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(
      new AppError('Your current password is wrong ,please try again', 401)
    );

  // 3) If so , update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Log user in, send JWT

  createSendToken(user, 200, req, res);
});
