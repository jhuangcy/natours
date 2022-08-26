// This is the entry point file
const dotenv = require('dotenv')
dotenv.config({path: './config.env'})
const mongoose = require('mongoose')

// Uncaught exceptions
process.on('uncaughtException', err =>
{
    console.log('UNCAUGHT EXCEPTION: server shutting down')
    console.log(err.name, err.message)
    process.exit(1)
})

const app = require('./app')

// console.log(app.get('env'))
// console.log(process.env)

mongoose.connect(process.env.DATABASE, {useNewUrlParser: true}).then(() => console.log('db connection successful'))

const port = process.env.PORT || 3000

const server = app.listen(port, () => console.log(`App running on port ${port}`))

// Unhandled rejections
process.on('unhandledRejection', err =>
{
    console.log('UNHANDLED REJECTION: server shutting down')
    console.log(err.name, err.message)
    server.close(() => process.exit(1))
})

// Heroku SIGTERM signal: heroku will send a signal to our server to restart every day. The shutdown is abrupt and may leave hanging requests.
process.on('SIGTERM', () =>
{
    console.log('SIGTERM received. Shutting down gracefully.')
    server.close(() => 
    {
        console.log('Process terminated')
    })
})