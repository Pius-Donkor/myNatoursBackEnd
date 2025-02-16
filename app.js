const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const xss = require('xss-clean');
const hpp = require('hpp');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewsRoute');
const viewsRouter = require('./routes/viewsRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

app.enable('trust proxy'); //for heroku

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
// Middlewares are executed in the order at which they are organized in the code
// always remember to call next() after any middleware build

// 1 GLOBAL  MIDDLEWARE
// serving static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// set security http headers
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour'
});

// limit requests from same IP
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against noSQL attacks
app.use(mongoSanitize());
// Data sanitization against XSS attacks
app.use(xss());

// Protection against parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'difficulty',
      'price',
      'ratingAverage',
      'maxGroupSize',
      'ratingsQuantity'
    ]
  })
);

// app.use((req, res, next) => {
//   console.log('hello from middleware ✋');
//   next();
// });
app.use(compression());

app.use((req, res, next) => {
  // console.log(req.headers);
  // console.log(req.cookies);
  req.requestTime = new Date().toISOString();
  next();
});

// 2 ROUTES MIDDLEWARE

app.use('/', viewsRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
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
