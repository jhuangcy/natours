// Script file for importing/deleting test data. This file is independent of the project.

const fs = require('fs')
const dotenv = require('dotenv')
dotenv.config({path: './config.env'})
const mongoose = require('mongoose')

const Tour = require('../../models/tourModel')
const User = require('../../models/userModel')
const Review = require('../../models/reviewModel')

// Connect to db
mongoose.connect(process.env.DATABASE, {useNewUrlParser: true}).then(() => console.log('db connection successful'))

// Read json file
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'))
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'))
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'))
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'))

// Import data into db
const importData = async () =>
{
    try 
    {
        await Tour.create(tours)

        // Turn off validation (and comment out password encryption in the user model)
        // Passwords for all users is test1234
        await User.create(users, {validateBeforeSave: false})
        await Review.create(reviews)
        console.log('Data loaded')
    } 
    catch (error) 
    {
        console.log(error)
    }
    process.exit()
}

// Delete all data from db
const deleteData = async () =>
{
    try 
    {
        await Tour.deleteMany()
        await User.deleteMany()
        await Review.deleteMany()
        console.log('Data deleted')
    } 
    catch (error) 
    {
        console.log(error)
    }
    process.exit()
}


if (process.argv[2] === '--import') importData()
else if (process.argv[2] === '--delete') deleteData()


// console.log(process.argv)
// node dev-data/data/import-dev-data.js
// [
//     'C:\\Program Files\\nodejs\\node.exe',
//     'C:\\Users\\Admin\\Desktop\\complete-node-bootcamp-master\\4-natours\\starter-mongo\\dev-data\\data\\import-dev-data.js'
// ]

// node dev-data/data/import-dev-data.js --import
// [
//     'C:\\Program Files\\nodejs\\node.exe',
//     'C:\\Users\\Admin\\Desktop\\complete-node-bootcamp-master\\4-natours\\starter-mongo\\dev-data\\data\\import-dev-data.js',
//     '--import'
// ]