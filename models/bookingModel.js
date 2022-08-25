const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
    price: {
        type: Number,
        required: [true, 'Booking must have a price']
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },

    // Just in case we want to manually create a booking that will be paid at a later date (not through Stripe)
    paid: {
        type: Boolean,
        default: true
    },

    // Linked to tour and user
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Booking must belong to a tour']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Booking must belong to a user']
    }
    
},
{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
})

// Populate tour and user data
bookingSchema.pre(/^find/, function (next)
{
    this.populate('user').populate({
        path: 'tour',
        select: 'name'
    })
    next()
})

const Booking = mongoose.model('Booking', bookingSchema)

module.exports = Booking