const express = require('express')

// Each exported function can also be destructured
const tourController = require('../controllers/tourController')
const authController = require('../controllers/authController')
// const reviewController = require('../controllers/reviewController')

const reviewRouter = require('../routes/reviewRoutes')

const router = express.Router()

// Nested routes (put at the top)
// Make sure to 'merge params' in the other router, so params can be passed to it
router.use('/:tourId/reviews', reviewRouter)

// Alias route: This route will have some pre-defined query params
// We usually provide these for popular pages users might visit
router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours)
router.route('/tour-stats').get(tourController.getTourStats)
router.route('/monthly-plan/:year').get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guides'), tourController.getMonthlyPlan)

// Tours within a certain radius
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin)

// Distance to all tours given a point
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances)

router
    .route('/')
    .get(tourController.getAllTours)
    .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour)

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.uploadTourImages, tourController.resizeTourImages, tourController.updateTour)
    .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour)

// Nested route (don't do it like this)
// router.route('/:tourId/reviews').post(authController.protect, authController.restrictTo('user'), reviewController.createReview)

module.exports = router