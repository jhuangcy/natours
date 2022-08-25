const express = require('express')

// Each exported function can also be destructured
const reviewController = require('../controllers/reviewController')
const authController = require('../controllers/authController')

// const router = express.Router()

// If another router routes to this one. merge params will get the params from the other router
const router = express.Router({mergeParams: true})

// All routes below need authorization
router.use(authController.protect)

router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(authController.restrictTo('user'), reviewController.setTourUserIds, reviewController.createReview)

router
    .route('/:id')
    .get(reviewController.getReview)
    .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
    .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview)

module.exports = router