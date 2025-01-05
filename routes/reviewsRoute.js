const express = require('express');

const authenticationController = require('./../controllers/authenticationController');
const reviewController = require('./../controllers/reviewController');

const router = express.Router({ mergeParams: true });

router.use(authenticationController.protect);

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
  .get(authenticationController.protect, reviewController.getReview)
  .patch(
    authenticationController.restrictTo('admin', 'user'),
    reviewController.updataReview
  )
  .delete(
    authenticationController.restrictTo('admin', 'user'),
    reviewController.deleteReview
  );

module.exports = router;
