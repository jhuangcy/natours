// CORE
const path = require('path')

// PKGS
const express = require('express')
const morgan = require('morgan')    // Logging
const rateLimit = require('express-rate-limit') // Rate limiting
const helmet = require("helmet")    // Secure http headers
const mongoSanitize = require('express-mongo-sanitize')     // Mongo sanitization
const xss = require('xss-clean')    // XSS sanitization
const hpp = require('hpp')  // Prevent parameter polution, will remove duplicate query parameter names
const cookieParser = require('cookie-parser')   // Read cookies from clients

// PROJ
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')
const reviewRouter = require('./routes/reviewRoutes')
const bookingRouter = require('./routes/bookingRoutes')
const viewRouter = require('./routes/viewRoutes')
const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')


const app = express()

// Define template engine
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

// Serving static files
// app.use(express.static(`${__dirname}/public`))  // http://localhost:3000/overview.html
app.use(express.static(path.join(__dirname, 'public')))


// MIDDLEWARE

// Helmet config to use leaflet and axios cdn links
// Or downgrade helmet: npm i helmet@3.23.3
const scriptSrcUrls = ['https://unpkg.com/', 'https://tile.openstreetmap.org', 'https://cdnjs.cloudflare.com', 'ws:', 'https://js.stripe.com/v3/']
const styleSrcUrls = ['https://unpkg.com/', 'https://tile.openstreetmap.org', 'https://fonts.googleapis.com/']
const connectSrcUrls = ['https://unpkg.com', 'https://tile.openstreetmap.org', 'https://cdnjs.cloudflare.com', 'ws:', 'https://js.stripe.com/v3/']
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com']
const frameSrcUrls = ['https://js.stripe.com/v3/']

app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: [],
        connectSrc: ["'self'", ...connectSrcUrls],
        scriptSrc: ["'self'", ...scriptSrcUrls],
        styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
        workerSrc: ["'self'", 'blob:'],
        objectSrc: [],
        imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
        fontSrc: ["'self'", ...fontSrcUrls],
        frameSrc: ["'self'", ...frameSrcUrls]
    }
}))

app.use(express.json({limit: '10kb'}))  // Limit req.body to 10kb
app.use(express.urlencoded({extended: true, limit: '10kb'}))    // For forms
app.use(cookieParser())
app.use(mongoSanitize())
app.use(xss())

// Want to allow some duplicate query names to go through
app.use(hpp({
    whitelist: ['duration', 'ratingsAverage', 'ratingsQuantity', 'maxGroupSize', 'difficulty', 'price']
}))

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'))

// 100 requests every 60 min
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour' 
}) 
app.use('/api', limiter)    // Only apply to api routes

// Test middleware
app.use((req, res, next) =>
{
    req.requestTime = new Date().toISOString()
    // console.log(req.cookies)
    next()
})

// TEMPLATE ROUTES
// app.get('/', (req, res) => 
// {
//     res.status(200).render('base', {
//         title: 'Exciting tours for adventurous people',
//         user: 'Jonas'
//     })
// })
app.use('/', viewRouter)

// API ROUTES
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/bookings', bookingRouter)


// Unhandled routes
app.all('*', (req, res, next) =>
{
    // res.status(404).json({
    //     status: 'fail',
    //     message: `Cannot find ${req.originalUrl} on this server`
    // })

    // If next() receives an argument, express will assume an error occured (anywhere in the app). And skip all other middlewares and go straight to the error one
    // const err = new Error(`Cannot find ${req.originalUrl} on this server`)
    // err.status = 'fail'
    // err.statusCode = 404

    // next(err)
    next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404))
})

// Error handling middleware (moved to errorController)
// app.use((err, req, res, next) =>
// {
//     err.statusCode = err.statusCode || 500
//     err.status = err.status || 'error'
//     res.status(err.statusCode).json({
//         staus: err.status,
//         message: err.message
//     })
// })
app.use(globalErrorHandler)

module.exports = app