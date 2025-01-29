const express = require('express');
const viewsController = require('./../controllers/viewsController');
const authenticationController = require('./../controllers/authenticationController');

const router = express.Router();

router.get(
  '/',
  authenticationController.isLoggedIn,
  viewsController.getOverview
);
router.get(
  '/tour/:slug',
  authenticationController.isLoggedIn,
  viewsController.getTour
);
router.get(
  '/login',
  authenticationController.isLoggedIn,
  viewsController.getLoginForm
);
router.get('/me', authenticationController.protect, viewsController.getAccount);

module.exports = router;
