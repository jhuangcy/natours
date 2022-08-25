// This is a factory that creates other functions. It's meant to reduce duplicating similar handlers in controllers.
const APIFeatures = require('../utils/apiFeatures')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')

// Factory for delete handlers
exports.deleteOne = Model => catchAsync(async (req, res, next) => 
{
    const id = req.params.id
    const doc = await Model.findByIdAndDelete(id)

    if (!doc) return next(new AppError('No doc found with that id', 404))

    res.status(204).json({
        status: 'success', 
        data: null
    })
})

// Factory for update handlers
exports.updateOne = Model => catchAsync(async (req, res, next) => 
{
    const id = req.params.id
    const body = req.body
    const doc = await Model.findByIdAndUpdate(id, body, {
        new: true,
        runValidators: true
    }) 

    if (!doc) return next(new AppError('No doc found with that id', 404))

    res.status(200).json({
        status: 'success', 
        data: {data: doc}
    })
})

// Factory for create handlers
exports.createOne = Model => catchAsync(async (req, res, next) => 
{
    const doc = await Model.create(req.body)    
    res.status(201).json({
        status: 'success', 
        data: doc
    })
})

// Factory for fine one handlers
exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => 
{ 
    const id = req.params.id

    let query = Model.findById(id)
    if (popOptions) query = query.populate(popOptions)  // Some use populate, eg. {path: 'reviews'}

    // const doc = await Model.findById(id).populate('reviews')
    const doc = await query

    if (!doc) return next(new AppError('No doc found with that id', 404))
    
    res.status(200).json({
        status: 'success', 
        data: doc
    })
})

// Factory for find all handlers
exports.getAll = Model => catchAsync(async (req, res, next) => 
{
    // To allow getting nested reviews on tour (copied from review controller)
    let filter = {}
    if (req.params.tourId) filter = {tour: req.params.tourId} 

    const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()

    const docs = await features.query
    // const docs = await features.query.explain()      // Get query stats (look for executionStats)
    
    res.status(200).json({
        status: 'success', 
        results: docs.length, 
        data: docs
    })
})