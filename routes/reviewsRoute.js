const express = require('express');

const authenticationController = require('./../controllers/authenticationController');
const reviewController = require('./../controllers/reviewController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(authenticationController.protect, reviewController.getAllReviews)
  .post(
    authenticationController.protect,
    authenticationController.restrictTo('user'),
    reviewController.setUserTourIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(authenticationController.protect, reviewController.getReview);

module.exports = router;
