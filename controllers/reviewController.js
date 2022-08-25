const Review = require('../models/reviewModel')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const factory = require('./handlerFactory')

// Get all reviews in a tour
/*exports.getAllReviews = catchAsync(async (req, res, next) => 
{
    // Can still allow debug way of getting all reviews
    // This is moved into the factory as well
    let filter = {}
    if (req.params.tourId) filter = {tour: req.params.tourId} 

    const reviews = await Review.find(filter)
    
    res.status(200).json({
        status: 'success', 
        results: reviews.length, 
        data: {reviews}
    })
})*/
exports.getAllReviews = factory.getAll(Review)

// exports.getReview = catchAsync(async (req, res, next) => 
// { 
//     const id = req.params.id
//     const review = await Review.findById(id)

//     if (!review) return next(new AppError('No review found with that id', 404))
    
//     res.status(200).json({
//         status: 'success', 
//         data: {review}
//     })
// })
exports.getReview = factory.getOne(Review)

// Review created from tour route
// exports.createReview = catchAsync(async (req, res, next) => 
// {
//     // Can still allow debug way of creating reviews
//     if (!req.body.tour) req.body.tour = req.params.tourId
//     if (!req.body.user) req.body.user = req.user.id

//     const newReview = await Review.create(req.body)
//     res.status(201).json({
//         status: 'success', 
//         data: {reviews: newReview}
//     })
// })

// Specific middleware for create review, then we can use the factory for create
exports.setTourUserIds = (req, res, next) =>
{
    if (!req.body.tour) req.body.tour = req.params.tourId
    if (!req.body.user) req.body.user = req.user.id
    next()
}
exports.createReview = factory.createOne(Review)

// exports.updateReview = catchAsync(async (req, res, next) => 
// {
//     const id = req.params.id
//     const body = req.body
//     const review = await Review.findByIdAndUpdate(id, body, {
//         new: true,
//         runValidators: true
//     }) 

//     if (!review) return next(new AppError('No review found with that id', 404))

//     res.status(200).json({
//         status: 'success', 
//         data: {review}
//     })   
// })
exports.updateReview = factory.updateOne(Review)

// exports.deleteReview = catchAsync(async (req, res, next) => 
// {
//     const id = req.params.id
//     const review = await Review.findByIdAndDelete(id)

//     if (!review) return next(new AppError('No review found with that id', 404))

//     res.status(204).json({
//         status: 'success', 
//         data: null
//     })
// })
exports.deleteReview = factory.deleteOne(Review)