const express = require('express');

const router = express.Router();
const userController = require('./../controllers/userController');
const authenticationController = require('./../controllers/authenticationController');

router.post('/signup', authenticationController.signup);
router.post('/login', authenticationController.login);
router.post('/forgotPassword', authenticationController.forgotPassword);
router.post('/resetPassword/:token', authenticationController.resetPassword);

router.route('/').get(userController.getAllUsers);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
