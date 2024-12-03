const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// Middlewares are executed in the order at which they are organized in the code
// always remember to call next() after any middleware build

// 1 MIDDLEWARE

app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.static(`${__dirname}/public`));
app.use((req, res, next) => {
  console.log('hello from middleware ✋');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.all('*', function(req, res, next) {
  // const err = new Error(`can't find ${req.originalUrl} on the server `);
  // err.statusCode = 404;
  // err.status = 'fail';

  next(new AppError(`can't find ${req.originalUrl} on the server `, 404));
});

app.use(globalErrorHandler);

// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', postTour);
// app.get('/api/v1/tours/:id', getTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

module.exports = app;
