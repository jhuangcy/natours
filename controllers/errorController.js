const req = require("express/lib/request")
const AppError = require("../utils/appError")

const handleCastErrorDB = err =>
{
    const message = `Invalid ${err.path}: ${err.value}`
    return new AppError(message, 400)
}

const handleDuplicateFieldsDB = err =>
{
    // console.log(err)
    const message = `Duplicate field value: ${err.keyValue.name}. Please use another value`
    return new AppError(message, 400)
}

const handleValidationErrorDB = err =>
{
    const errors = Object.values(err.errors).map(e => e.message)
    const message = `Invalid input data: ${errors.join('. ')}`
    return new AppError(message, 400)
}

const handleJWTError = () => new AppError('Invalid token', 401)
const handleJWTExpiredError = () => new AppError('Token expred', 401)


const sendErrorDev = (err, req, res) =>
{
    if (req.originalUrl.startsWith('/api'))
    {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        })
    }
    else
    {
        console.error(err)

        // Render error page for client (dev)
        res.status(err.statusCode).render('error', {
            title: 'Something went wrong',
            msg: err.message
        })
    }
}

const sendErrorProd = (err, req, res) =>
{
    if (req.originalUrl.startsWith('/api'))
    {
        if (err.isOperational)
        {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            })
        }
        else
        {
            console.error(err)
    
            res.status(500).json({
                status: 'error',
                message: 'Something went wrong'
            })
        }
    }
    else
    {
        // Render error page for client (prod)
        if (err.isOperational)
        {
            res.status(err.statusCode).render('error', {
                title: 'Something went wrong',
                msg: err.message
            })
        }
        else
        {
            console.error(err)
    
            res.status(500).render({
                title: 'Something went wrong',
                msg: 'Please try again later'
            })
        }
    }
}

module.exports = (err, req, res, next) =>
{
    err.statusCode = err.statusCode || 500
    err.status = err.status || 'error'

    if (process.env.NODE_ENV === 'development')
    {
        sendErrorDev(err, req, res)
    }
    else if (process.env.NODE_ENV === 'production')
    {
        // let error = {...err}
        // error.message = err.message
        let error = Object.assign(err)  // Mongoose 6+

        if (error.name === 'CastError') error = handleCastErrorDB(error)
        if (error.code === 11000) error = handleDuplicateFieldsDB(error)
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error)
        if (error.name === 'JsonWebTokenError') error = handleJWTError(error)
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError(error)

        sendErrorProd(error, req, res)
    }
}