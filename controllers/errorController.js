const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
  const message = `invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  // console.log(Object.values(err.keyValue).at(0));
  const value = Object.values(err.keyValue).at(0);
  const message = `Duplicate field value /"${value}"/ . please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const value = Object.values(err.errors)
    .map(el => el.message)
    .join('. ');
  // console.log(err);
  const message = `Invalid input data : ${value}`;
  return new AppError(message, 400);
};

const sendErrorProd = (err, res) => {
  // console.log(err.isOperational);
  if (err.isOperational) {
    // operational trusted error send error to client
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });

    // programming or other unknown errors
  } else {
    // 1) log error
    console.error('ERROR 💥', err);

    // 2) send generic message
    res.status(500).json({
      status: 'error',
      message: 'sorry something was wrong !'
    });
  }
};

const sendErrorDev = (err, res) => {
  // console.log(err.name);
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    // console.log(err);
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // console.log(process.env.NODE_ENV);
    // console.log(err.name);
    let error = { ...err };
    error.name = err.name; // Explicitly copy `name`
    error.message = err.message;
    error.code = err.code;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    // console.log(error.isOperational, error.statusCode, error.name);

    sendErrorProd(error, res);
  }
  next();
};
