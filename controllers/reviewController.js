const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');

exports.setUserTourIds = catchAsync(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };
  const newReviews = await Review.find(filter);
  res.status(200).json({
    status: 'success',
    result: newReviews.length,
    data: {
      newReviews
    }
  });
});

exports.getReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(new AppError('There is no review with this ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { review }
  });
});

exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updataReview = factory.updateOne(Review);
