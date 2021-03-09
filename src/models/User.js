const mongoose = require('../database')
const bcrypt = require('bcryptjs')
const Scheema = mongoose.Schema

const UserSchema = new Scheema({
    name: {
        type: String,
        require: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true
    },
    password: {
        type: String,
        require: true,
        select: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

// Middleware
UserSchema.pre('save', async function (next) {
    // 'this' refere-se ao objeto que está sendo salvo (UserSchema)
    const hash = await bcrypt.hashSync(this.password, 10)
    this.password = hash

    next()
})

const User = mongoose.model('User', UserSchema)

module.exports = User