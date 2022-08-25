const multer = require('multer')    // Photo uploads
const sharp = require('sharp')      // Photo resize

const Tour = require('../models/tourModel')
const APIFeatures = require('../utils/apiFeatures')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const factory = require('./handlerFactory')


// Multer setup (to be used when updating tour)
// Store image to memory
const multerStorage = multer.memoryStorage()
  
const multerFilter = (req, file, cb) => 
{
    // Store the file
    if (file.mimetype.startsWith('image')) 
        cb(null, true)
  
    // Dont store the file
    else 
        cb(new AppError('File is not an image', 400), false)
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})

// If the form has more than 1 file upload inputs
exports.uploadTourImages = upload.fields([
    {name: 'imageCover', maxCount: 1},
    {name: 'images', maxCount: 3}
])

// If the form only has 1 file upload input for multiple images
// upload.array('images', 5)

exports.resizeTourImages = catchAsync(async (req, res, next) =>
{
    if (!req.files.imageCover || !req.files.images) return next()

    // console.log(req.files)
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`

    // Cover image
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({quality: 90})
        .toFile(`public/img/tours/${req.body.imageCover}`)

    // Other images
    req.body.images = []
    await Promise.all(req.files.images.map(async (file, i) =>
    {
        const filename = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`
        await sharp(file.buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({quality: 90})
            .toFile(`public/img/tours/${filename}`)

        req.body.images.push(filename)
    }))

    next()
})


// {{localhost}}/api/v1/tours/top-5-cheap
exports.aliasTopTours = (req, res, next) =>
{
    req.query.limit = '5'
    req.query.sort = 'ratingsAverage,price'
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
    next()
}

/*exports.getAllTours = catchAsync(async (req, res, next) => 
{
    // The reason we pass in Tour.find() is so the method chain can be in any order (filter, sort, etc.)
    // If we only pass in the model Tour, then the first method in the chain must be .filter() and it must be present
    const features = new APIFeatures(Tour.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()

    // Exec query
    // const tours = await query
    const tours = await features.query
    
    res.status(200).json({
        status: 'success', 
        results: tours.length, 
        data: {tours}
    })
})*/
exports.getAllTours = factory.getAll(Tour)

/*exports.getTour = catchAsync(async (req, res, next) => 
{ 
    const id = req.params.id
    const tour = await Tour.findById(id).populate('reviews')

    // Populate gets references to other docs
    // const tour = await Tour.findById(id).populate('guides')

    // Can be moved to model middleware
    // const tour = await Tour.findById(id).populate({
    //     path: 'guides',
    //     select: '-__v -passwordChangedAt'   // Hide some fields
    // })

    if (!tour) return next(new AppError('No tour found with that id', 404))
    
    res.status(200).json({
        status: 'success', 
        data: {tour}
    })
})*/
exports.getTour = factory.getOne(Tour, {path: 'reviews'})

// exports.createTour = catchAsync(async (req, res, next) => 
// {
//     const newTour = await Tour.create(req.body)    
//     res.status(201).json({
//         status: 'success', 
//         data: {tour: newTour}
//     })
// })
exports.createTour = factory.createOne(Tour)

// exports.updateTour = catchAsync(async (req, res, next) => 
// {
//     const id = req.params.id
//     const body = req.body
//     const tour = await Tour.findByIdAndUpdate(id, body, {
//         new: true,  // Return the updated doc
//         runValidators: true     // Also validate data on update
//     }) 

//     if (!tour) return next(new AppError('No tour found with that id', 404))

//     res.status(200).json({
//         status: 'success', 
//         data: {tour: tour}
//     })   
// })
exports.updateTour = factory.updateOne(Tour)

// exports.deleteTour = catchAsync(async (req, res, next) => 
// {
//     const id = req.params.id
//     const tour = await Tour.findByIdAndDelete(id)

//     if (!tour) return next(new AppError('No tour found with that id', 404))

//     res.status(204).json({
//         status: 'success', 
//         data: null
//     })
// })
exports.deleteTour = factory.deleteOne(Tour)


// Aggregation pipeline stages
exports.getTourStats = catchAsync(async (req, res, next) =>
{
    const stats = await Tour.aggregate([
        {
            $match: {ratingsAverage: {$gte: 4.5}}
        },
        {
            $group: {
                // id is the field to group by (null will group the entire collection)
                _id: {$toUpper: '$difficulty'},
                numTours: {$sum: 1},
                numRatings: {$sum: '$ratingsQuantity'},
                avgRating: {$avg: '$ratingsAverage'},
                avgPrice: {$avg: '$price'},
                minPrice: {$min: '$price'},
                maxPrice: {$max: '$price'}
            }
        },
        {
            $sort: {avgPrice: 1}
        },
        // {
        //     $match: {_id: {$ne: 'EASY'}}
        // }
    ])

    res.status(200).json({
        status: 'success', 
        data: {stats}
    })
})

exports.getMonthlyPlan = catchAsync(async (req, res, next) =>
{
    const year = +req.params.year
    const plan = await Tour.aggregate([
        {
            // startDates is an array, so unwind will create an object for each startDate
            $unwind: '$startDates'
        },
        {
            $match: {startDates: {
                $gte: new Date(`${year}-01-01`),
                $lte: new Date(`${year}-12-31`)
            }}
        },
        {
            $group: {
                _id: {$month: '$startDates'},
                numTourStarts: {$sum: 1},
                tours: {$push: '$name'}     // Array
            }
        },
        {
            $addFields: {month: '$_id'}
        },
        {
            // Hide or show fields
            $project: {_id: 0}
        },
        {
            $sort: {numTourStarts: -1}
        },
        {
            $limit: 12
        }
    ])

    res.status(200).json({
        status: 'success', 
        data: {plan}
    })
})

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/33.902842,-118.330739/unit/mi
// To see maps in Compass: go to Help > Privacy Settings > Enable Geographic Visualizations
exports.getToursWithin = catchAsync(async (req, res, next) =>
{
    const {distance, latlng, unit} = req.params
    const [lat, lng] = latlng.split(',')
    
    // The unit of the radius needs to be converted to radians (divide distance by the radius of the earth)
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1
    // console.log(radius)

    if (!lat || !lng) next(new AppError('Please provide lat/lng in the format lat,lng', 400))

    const tours = await Tour.find({
        startLocation: {$geoWithin: {
            $centerSphere: [
                [lng, lat],     // This is reversed
                radius          // In radians
            ]
        }}
    })

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {data: tours}
    })
})

exports.getDistances = catchAsync(async (req, res, next) =>
{
    const {latlng, unit} = req.params
    const [lat, lng] = latlng.split(',')

    // To turn meters into miles or km
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001

    if (!lat || !lng) next(new AppError('Please provide lat/lng in the format lat,lng', 400))

    // geoNear must be the 1st stage in geospacial aggregations
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [+lng, +lat]   // This is reversed
                },
                distanceField: 'distance',      // Will add a 'distance' field to the results
                distanceMultiplier: multiplier  // In meters by default
            }
        },
        {
            // Just return these fields
            $project: {
                name: 1,
                distance: 1
            }
        }
    ])

    res.status(200).json({
        status: 'success',
        data: {data: distances}
    })
})