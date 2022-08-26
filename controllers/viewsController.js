const Tour = require('../models/tourModel')
const User = require('../models/userModel')
const Booking = require('../models/bookingModel')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')

exports.getOverview = catchAsync(async (req, res, next) =>
{
    // Get all tour data
    const tours = await Tour.find()

    res.status(200).render('overview', {
        title: 'Exciting tours for adventurous people',
        tours
    })
})

exports.getTour = catchAsync(async (req, res, next) =>
{
    // Get tour (include reviews)
    const slug = req.params.slug
    const tour = await Tour.findOne({slug}).populate({
        path: 'reviews',
        fields: 'review rating user'
    })

    if (!tour) return next(new AppError('There is no tour with that name', 404))
    
    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour
    })
})

exports.getLoginForm = async (req, res) =>
{
    res.status(200).render('login', {
        title: 'Log into your account'
    })
}

exports.getAccount = async (req, res) =>
{
    res.status(200).render('account', {
        title: 'Your account'
    })
}

// If submitting form without going through our api
exports.updateUserData = catchAsync(async (req, res, next) =>
{
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        name: req.body.name,
        email: req.body.email
    },
    {
        new: true,
        runValidators: true
    })

    res.status(200).render('account', {
        title: 'Your account',
        user: updatedUser
    })
})

// Gets tours purchased by user
exports.getMyTours = catchAsync(async (req, res, next) =>
{
    // Find all bookings from logged in user
    const bookings = await Booking.find({user: req.user.id})

    // Find tours with booking ids (without virtual populate)
    const tourIds = bookings.map(el => el.tour)     // Bookings only store tour ids
    const tours = await Tour.find({_id: {$in: tourIds}})    // If the id is contained in our array

    // Reusing the overview page
    res.status(200).render('overview', {
        title: 'My bookings',
        tours
    })
})

// For picking up alerts from the server in the query params
exports.alerts = (req, res, next) =>
{
    const {alert} = req.query
    if (alert === 'booking') res.locals.alert = 'Your booking was successful'

    next()
}