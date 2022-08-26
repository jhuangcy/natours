const express = require('express')

const viewsController = require('../controllers/viewsController')
const authController = require('../controllers/authController')
const bookingController = require('../controllers/bookingController')

const router = express.Router()

// This is so we can check user login status on pages and display custom content
// router.use(authController.isLoggedIn)

// View routes will only use GET
// router.get('/', (req, res) => 
// {
//     // This is the pug file
//     res.status(200).render('base', {
//         title: 'Exciting tours for adventurous people',
//         user: 'Jonas'
//     })
// })

// router.get('/overview', (req, res) =>
// {
//     res.status(200).render('overview', {
//         title: 'All Tours'
//     })
// })
router.get('/', /*bookingController.createBookingCheckout,*/ authController.isLoggedIn, viewsController.getOverview)

// router.get('/tour', (req, res) =>
// {
//     res.status(200).render('tour', {
//         title: 'The Forest Hiker Tour'
//     })
// })
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour)

// Can use api protect middleware to lock routes (by checking the jwt in cookies)
// router.get('/tour/:slug', authController.protect, viewsController.getTour)

router.get('/login', authController.isLoggedIn, viewsController.getLoginForm)
router.get('/me', authController.protect, viewsController.getAccount)
router.get('/my-tours', authController.protect, viewsController.getMyTours)

// If submitting form without going through our api
router.post('/submit-user-data', authController.protect, viewsController.updateUserData)

module.exports = router