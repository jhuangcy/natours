const mongoose = require('mongoose')

const Tour = require('./tourModel')

// Create schema
const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review cannot be empty']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour']
    }
    ,
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    }
    
},
{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
})

// Create custom index
// This will only allow a user to submit a review for a tour once, because the index is unique
reviewSchema.index({tour: 1, user: 1}, {unique: true})

// Static function to calculate stats
reviewSchema.statics.calcAverageRating = async function(tourId)
{
    const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                _id: '$tour',
                numRatings: {$sum: 1},
                avgRating: {$avg: '$rating'},
            }
        }
    ])
    // console.log(stats)

    if (stats.length > 0)
    {
        // Save to tour model
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].numRatings,
            ratingsAverage: stats[0].avgRating 
        })
    }
    else
    {
        // Use defaults
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        })
    }
}

// Show other docs when review is retrieved
reviewSchema.pre(/^find/, function(next)
{
    this
    // .populate({
    //     path: 'tour',
    //     select: 'name'
    // })
    .populate({
        path: 'user',
        select: 'name photo'
    })
    next()
})

// Update stats when review is updated/deleted
// reviewSchema.pre(/^findOneAnd/, async function(next)
// {
//     // Get the current review from query (by executing it). This has not yet been saved to the db.
//     // const r = await this.findOne().clone()
//     // console.log(r)

//     // Save it to the object for now
//     this.r = await this.findOne().clone()

//     next()
// })

reviewSchema.post('save', function() 
{
    this.constructor.calcAverageRating(this.tour)   // this.constructor is the model that created the doc
})

// This will use the variable stored by the pre 'findOneAnd' function
// Because the findOne() function cannot be used here as the query is already executed
// reviewSchema.post(/^findOneAnd/, async function()
// {
//     await this.r.constructor.calcAverageRating(this.r.tour)
// })

// Update stats when review is updated/deleted
// Better way to do this is below. Since we get the 'doc' object on a post 'findOneAnd' call
// This way, we dont need the pre function
reviewSchema.post(/^findOneAnd/, async function(doc)
{
    await doc.constructor.calcAverageRating(doc.tour)
})

const Review = mongoose.model('Review', reviewSchema)

module.exports = Review