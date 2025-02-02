const express = require('express');

const router = express.Router();
const userController = require('./../controllers/userController');
const authenticationController = require('./../controllers/authenticationController');

router.post('/signup', authenticationController.signup);
router.post('/login', authenticationController.login);
router.get('/logout', authenticationController.logout);
router.post('/forgotPassword', authenticationController.forgotPassword);
router.patch('/resetPassword/:token', authenticationController.resetPassword);

// protect the routes after this middleware
router.use(authenticationController.protect);

router.patch(
  '/changeMyPassword',
  authenticationController.protect,
  authenticationController.updatePassword
);
router.patch(
  '/updateMe',
  authenticationController.protect,
  userController.updateMe
);
router.delete(
  '/deleteMe',
  authenticationController.protect,
  userController.deleteMe
);
router.route('/me').get(userController.getMe, userController.getUser);

// restrict all routes after this middleware
router.use(authenticationController.restrictTo('admin', 'lead-guide'));

router.route('/').get(userController.getAllUsers);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
