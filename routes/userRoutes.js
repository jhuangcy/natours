const express = require('express')

const userController = require('../controllers/userController')
const authController = require('../controllers/authController')

const router = express.Router()

router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.post('/forgotpassword', authController.forgotPassword)
router.patch('/resetpassword/:token', authController.resetPassword)
router.get('/logout', authController.logout)

// All routes below need authorization
router.use(authController.protect)

router.patch('/updatemypassword', authController.updatePassword)
router.patch('/updateme', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe)  // 'photo' is the form field for the image
router.delete('/deleteme', userController.deleteMe)
router.get('/me', userController.getMe, userController.getUser)

// All routes below are only for admins
router.use(authController.restrictTo('admin'))

router
    .route('/')
    .get(userController.getAllUsers)
    // .post(userController.createUser)     // Will not be doing this

router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser)

module.exports = router