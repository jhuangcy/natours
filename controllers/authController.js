const {promisify} = require('util')     // For turning sync function into async
const crypto = require('crypto')

const jwt = require('jsonwebtoken')

const User = require('../models/userModel')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
// const sendEmail = require('../utils/email')
const Email = require('../utils/email')

const signToken = id => 
{
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN})
}

const createSendToken = (user, statusCode, res) =>
{
    const token = signToken(user._id)

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        // secure: true,   // https only
        httpOnly: true  // Browser cannot modify cookie
    }

    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true

    user.password = undefined   // Hide the password field on create user

    res.cookie('jwt', token, cookieOptions)
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {user}
    })
}

exports.signup = catchAsync(async (req, res, next) =>
{
    // const newUser = await User.create(req.body)
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        // passwordChangedAt: req.body.passwordChangedAt
    })

    const url = `${req.protocol}://${req.get('host')}/me`
    await new Email(newUser, url).sendWelcome()

    // const token = signToken(newUser._id)
    // res.status(201).json({
    //     status: 'success',
    //     token,
    //     data: {user: newUser}
    // })
    createSendToken(newUser, 201, res)
})

exports.login = catchAsync(async (req, res, next) => 
{
    const {email, password} = req.body

    // Check if user email/password exists
    if (!email || !password) return next(new AppError('Please provide an email and password', 400))

    // Check if user exists
    const user = await User.findOne({email}).select('+password')
    if (!user) return next(new AppError('Incorrect email or password', 401))    // Shouldn't let users know if email exists
    
    // Check if passwords match
    const correct = await user.correctPassword(password, user.password)
    if (!correct) return next(new AppError('Incorrect email or password', 401))

    // const token = signToken(user._id)
    // res.status(200).json({
    //     status: 'success',
    //     token
    // })
    createSendToken(user, 200, res)
})

// Since cookie is used, server will handle logging out
exports.logout = (req, res) =>
{
    // Send a dummy cookie to the client with the same name which will overwrite the original (due to cookie option httpOnly: true)
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),  // 10sec expiry
        httpOnly: true
    })
    res.status(200).json({
        status: 'success'
    })
}

// For protecting routes (can be used client side too)
exports.protect = catchAsync(async (req, res, next) => 
{
    let token

    // Check for token from user (bearer and cookie)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
        token = req.headers.authorization.split(' ')[1]
    else if (req.cookies.jwt && req.cookies.jwt !== 'loggedout')
        token = req.cookies.jwt

    if (!token) return next(new AppError('You are not logged in', 401))

    // Verify
    // Turn jwt.verify into async function so we don't have to use try/catch
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    // console.log(decoded)
    
    // Check if user exists
    const freshUser = await User.findById(decoded.id)
    if (!freshUser) return next(new AppError('The user belonging to the token no longer exists', 401))
    
    // Check if user changed password after token was issued
    if (freshUser.changedPasswordAfter(decoded.iat)) return next(new AppError('User recently changed password', 401))

    req.user = freshUser
    res.locals.user = freshUser     // Expose user to pug templates
    next()  // Grant access to route
})

// This is used on the client to check if user is logged in. 
// Only for rendered pages, so we don't want to send any errors to our global error handler
exports.isLoggedIn = async (req, res, next) => 
{
    // Check for token from user (only in cookie)
    if (req.cookies.jwt)
    {
        try 
        {
            // Verify
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET)
            
            // Check if user exists
            const freshUser = await User.findById(decoded.id)
            if (!freshUser) return next()
            
            // Check if user changed password after token was issued
            if (freshUser.changedPasswordAfter(decoded.iat)) return next()
        
            res.locals.user = freshUser     // Expose user to pug templates
        } 
        catch (error) 
        {
            return next()
        }
    }
    next()
}

// Role specific route restrictions
// Since we need to pass in our own parameters, we wrap the middleware function in our own
exports.restrictTo = (...roles) =>
{
    // The actual middleware function has access to our parameters now
    return (req, res, next) =>
    {
        // If the user role matches any roll we passed in
        if (!roles.includes(req.user.role)) 
            return next(new AppError('You do not have permission to perform this action', 403))

        next()
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) =>
{
    // Find user with email
    const user = await User.findOne({email: req.body.email})
    if (!user) return next(new AppError('There is no user with that email address', 404))

    // Create token
    const resetToken = user.createPasswordResetToken()
    await user.save({validateBeforeSave: false})

    // Send email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetpassword/${resetToken}`
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetUrl}\nIf you didn't forget your password, please ignore this email.`

    // Even though we already use the global error handler, we still need to do some custom cleanup here
    try 
    {
        // await sendEmail({
        //     email: user.email,
        //     subject: 'Your password reset token (expires in 10 min)',
        //     message
        // })
        await new Email(user, resetUrl).sendPasswordReset()
    
        res.status(200).json({ 
            status: 'success', 
            data: 'Token sent to email' 
        })
    } 
    catch (error) 
    {
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave: false })
        return next(new AppError('There was an error sending the email', 500))
    }
    
})

exports.resetPassword = catchAsync(async (req, res, next) =>
{
    // Find user from email token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

    // Check if token expired, check if user exists
    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()}})
    if (!user) return next(new AppError('Token is invalid or has expired', 400))

    // Update user
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    // Send jwt
    // const token = signToken(user._id)
    // res.status(200).json({
    //     status: 'success',
    //     token
    // })
    createSendToken(user, 200, res)
})

exports.updatePassword = catchAsync(async (req, res, next) => 
{
    // Find user
    const user = await User.findById(req.user.id).select('+password')

    // Check if old entered password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
        return next(new AppError('Your current password is wrong', 401))

    // Update password
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    await user.save()

    // Send jwt
    // const token = signToken(user._id)
    // res.status(200).json({
    //     status: 'success',
    //     token
    // })
    createSendToken(user, 200, res)
})