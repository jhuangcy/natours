const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const Tour = require('../models/tourModel')
const Booking = require('../models/bookingModel')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const factory = require('./handlerFactory')

// After calling this route, we can see this recorded in the Stripe account as "incomplete"
exports.getCheckoutSession = catchAsync(async (req, res, next) =>
{
    // Get currently booked tour
    const tour = await Tour.findById(req.params.tourId)

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],

        // During development, we will put booking data as query string
        // This is not secure because anyone can access this route directly without going through Stripe
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,   // Redirect back home
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,   // Redirect to tour
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [{
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],   // Must be live images
            amount: tour.price * 100,   // In cents, so need to convert
            currency: 'usd',
            quantity: 1
        }]
    })

    // Send to client
    res.status(200).json({
        status: 'success',
        session
    })
})

// During development only
// Create booking on db (this will be on the home '/' route)
exports.createBookingCheckout = catchAsync(async (req, res, next) =>
{
    const {tour, user, price} = req.query

    if (!(tour && user && price)) return next()

    await Booking.create({tour, user, price})

    // Redirect back home, but remove query string
    res.redirect(req.originalUrl.split('?')[0])
})

exports.getAllBookings = factory.getAll(Booking)
exports.getBooking = factory.getOne(Booking)
exports.createBooking = factory.createOne(Booking)
exports.updateBooking = factory.updateOne(Booking)
exports.deleteBooking = factory.deleteOne(Booking)