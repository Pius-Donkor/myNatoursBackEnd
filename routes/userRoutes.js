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

router.patch('/changeMyPassword', authenticationController.updatePassword);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);
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
