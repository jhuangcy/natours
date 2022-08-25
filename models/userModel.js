const crypto = require('crypto')    // Password reset

const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter a name']
    },
    email: {
        type: String,
        required: [true, 'Please enter an email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please enter a valid email']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm the password'],
        validate: {
            // Only works on create and save (not update)
            validator: function(val) 
            {
                return val === this.password
            },
            message: 'The passwords do not match'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    }
})

// Encrypt the password (comment this out when importing user data)
userSchema.pre('save', async function(next)
{
    // Only run if password was modified
    if (!this.isModified('password')) return next()

    this.password = await bcrypt.hash(this.password, 12)
    this.passwordConfirm = undefined    // This field is not saved to the db
    next()
})

// Whenever password is updated
userSchema.pre('save', function(next)
{
    if (!this.isModified('password') || this.isNew) return next()

    this.passwordChangedAt = Date.now() - 1000  // The -1000ms is for just in case the token was created earlier than this date
    next()
})

// For hiding inactive users when getting users
userSchema.pre(/^find/, function(next)
{
    this.find({active: {$ne: false}})
    next()
})

// Instance methods
userSchema.methods.correctPassword = async function(candidatePassword, userPassword)
{
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.createPasswordResetToken = function()
{
    const resetToken = crypto.randomBytes(32).toString('hex')
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')  // Token should also be hashed before stored in the db
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000     // 10min
    return resetToken
}

// Check if user has changed password after jwt has been issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp)
{
    if (this.passwordChangedAt)
    {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
        // console.log(changedTimestamp, JWTTimestamp)
        return JWTTimestamp < changedTimestamp  // Password was changed
    }
    return false    // Password was not changed
}

// Create model from schema
const User = mongoose.model('User', userSchema)

module.exports = User