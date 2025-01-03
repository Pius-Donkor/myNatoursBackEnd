const express = require('express');
const tourController = require('./../controllers/tourController');
const authenticationController = require('./../controllers/authenticationController');
const reviewRouter = require('./reviewsRoute');

const router = express.Router();

// router.param('id', tourController.checkID);
// alias routing

// NESTED ROUTES
// POST   /tour/242354/reviews
// GET   /tour/242354/reviews
// POST /tour/242354/reviews/552365

// router
//   .route('/:tourId/reviews')
//   .post(
//     authenticationController.protect,
//     authenticationController.restrictTo('user'),
//     reviewController.createReview
//   );

// here we were implementing nested by using the ( reviewController.createReview) which was later  updated by relocating any route string that looked like "/:tourId/reviews"  to the reviewRouter.

router.use('/:tourId/reviews', reviewRouter);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router
  .route('/')
  .get(authenticationController.protect, tourController.getAllTours)
  .post(tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authenticationController.protect,
    authenticationController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
