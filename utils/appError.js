class AppError extends Error
{
    constructor(message, statusCode)
    {
        super(message)

        this.statusCode = statusCode
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        this.isOperational = true   // Operational errors only

        Error.captureStackTrace(this, this.constructor)     // Stack trace
    }
}

module.exports = AppError