const multer = require('multer')    // Photo uploads
const sharp = require('sharp')      // Photo resize

const User = require('../models/userModel')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const factory = require('./handlerFactory')


// Multer setup
// Storage image to disk
// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => cb(null, 'public/img/users'),
//     filename: (req, file, cb) => 
//     {
//         const ext = file.mimetype.split('/')[1]     // .jpeg
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//     }
// })

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

// const upload = multer({dest: 'public/img/users'})
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})

exports.uploadUserPhoto = upload.single('photo')

// Resize photo after uploaded, but not saved to storage yet (need to change multer)
exports.resizeUserPhoto = catchAsync(async (req, res, next) =>
{
    if (!req.file) return next()

    // Need to manually set filename
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

    // Buffer is only available if using memoryStorage
    await sharp(req.file.buffer)
        .resize(500, 500)   // Crop
        .toFormat('jpeg')
        .jpeg({quality: 90})
        .toFile(`public/img/users/${req.file.filename}`)
    
    next()
})

const filterObj = (obj, ...allowedFields) =>
{
    const newObj = {}
    Object.keys(obj).forEach(el =>
    {
        if (allowedFields.includes(el)) newObj[el] = obj[el]
    })
    return newObj
}

// exports.getAllUsers = catchAsync(async (req, res, next) =>
// {
//     const users = await User.find()
    
//     res.status(200).json({
//         status: 'success', 
//         results: users.length, 
//         data: {users}
//     })
// })
exports.getAllUsers = factory.getAll(User)

exports.getUser = factory.getOne(User)
// exports.createUser = factory.createOne(User)     // Will not be doing this
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)


exports.updateMe = catchAsync(async (req, res, next) =>
{
    // console.log(req.body)
    // console.log(req.file)

    if (req.body.password || req.body.passwordConfirm) return next(new AppError('This route is not for password updates', 400))

    const filteredBody = filterObj(req.body, 'name', 'email')
    if (req.file) filteredBody.photo = req.file.filename

    // findByIdAndUpdate will not trigger password validation
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {new: true, runValidators: true})

    res.status(200).json({
        status: 'success', 
        data: {user: updatedUser}
    })
})

// Will only set the user status to inactive
exports.deleteMe = catchAsync(async (req, res, next) =>
{
    await User.findByIdAndUpdate(req.user.id, {active: false})

    res.status(204).json({
        status: 'success', 
        data: null
    })
})

// Will be using the factory getOne (getUser), so this is a middleware that just sets the param user id with the currently logged in user id
exports.getMe = (req, res, next) =>
{
    req.params.id = req.user.id
    next()
}