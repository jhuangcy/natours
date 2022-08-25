const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')

// const User = require('./userModel')

// Create schema
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,   // Mongoose will create an index for unique fields
        trim: true,
        maxLength: [40, 'A tour name must be less than 40 characters'],
        minLength: [10, 'A tour name must have more than 10 characters'],
        // validate: [validator.isAlpha, 'A tour name can only contain characters']
    },
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty can only be: easy, medium, and difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be 1.0 or higher'],
        max: [5, 'Rating must be 5.0 or lower'],
        set: val => Math.round(val * 10) / 10   // Setter function that runs everytime before a value is saved
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            // Custom validator (return bool: true = no error, false = error)
            // This will not work for doc updates
            validator: function(val) 
            {
                return val < this.price
            },
            message: 'Discount price ({VALUE}) should be less than regular price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a summary']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now,
        select: false   // Will be hidden in query
    },
    startDates: [Date],
    slug: String,
    secretTour: {
        type: Boolean,
        default: false
    },
    // Embed location info into tour
    startLocation: {
        // GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    // If we want to embed users into tour (pass in array of user ids)
    // guides: Array

    // If we want to reference users (pass in array of user ids)
    // Getting objects from references is done in controllers
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
},
{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
})

// Add custom index for search requests (remove indexes from Compass manually if not used anymore)
// tourSchema.index({price: 1})    //1: sort asc, -1: sort desc
tourSchema.index({price: 1, ratingsAverage: -1})    // Compund index
tourSchema.index({slug: 1})
tourSchema.index({startLocation: '2dsphere'})   // Required for geospacial queries/aggregations

// Virtual properties are not stored in the db (computed when data is retrieved)
tourSchema.virtual('durationWeeks').get(function() 
{
    return this.duration / 7
})

// Virtual populate: get reviews for tour (tour does not contain ref to reviews)
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
})

// Document middleware
// Before doc is saved (eg. save(), create(), excluding saveMany())
tourSchema.pre('save', function(next)
{
    this.slug = slugify(this.name, {lower: true})
    next()
})

// If we want to embed users into tour
// Get users (guides) when tour is saved. During POST, guides just contains user ids.
// tourSchema.pre('save', async function(next)
// {
//     const guidesPromises = this.guides.map(async id => await User.findById(id))
//     this.guides = await Promise.all(guidesPromises)     // Guides now contain array of user docs
//     next()
// })

// Before query is executed ('this' will refer to the query)
// Use regular expression to cover all 'find...' queries
// tourSchema.pre('find', function(next)
tourSchema.pre(/^find/, function(next)
{
    this.find({secretTour: {$ne: true}})
    this.start = Date.now()     // Add a property to be used in post find()
    next()
})

// Show full user data when tour is retrieved
tourSchema.pre(/^find/, function(next)
{
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'   // Hide some fields
    })
    next()
})

// Before aggregation is executed
// tourSchema.pre('aggregate', function(next)
// {
//     // Add another stage to the aggregate pipeline (array)
//     // console.log(this)
//     this._pipeline.unshift({$match: {secretTour: {$ne: true}}});
//     next()
// })

// After doc is saved (put post functions after all pre functions)
// Doc is the saved document, so 'this' is not available
// tourSchema.post('save', function(doc, next)
// {
//     next()
// })

// After query exec
tourSchema.post(/^find/, function(docs, next)
{
    console.log(`query took ${Date.now() - this.start}ms`)
    next()
})

// Create model from schema
const Tour = mongoose.model('Tour', tourSchema)

// Create test data
// const testTour = new Tour({
//     name: 'The park camper',
//     price: 497
// })

// Save to database
// testTour.save().then(doc => console.log(doc)).catch(err => console.log(err))

module.exports = Tour