const express = require('express')

const bookingController = require('../controllers/bookingController')
const authController = require('../controllers/authController')

const router = express.Router()

router.use(authController.protect)

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession)

// Only leads and admins can manage bookings
router.use(authController.restrictTo('lead-guide', 'admin'))

router
    .route('/')
    .get(bookingController.getAllBookings)
    .post(bookingController.createBooking)

router
    .route('/:id')
    .get(bookingController.getBooking)
    .patch(bookingController.updateBooking)
    .delete(bookingController.deleteBooking)

module.exports = router