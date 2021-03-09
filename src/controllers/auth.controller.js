const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const authConfig = require('../config/auth')

const User = require('../models/User')

const router = express.Router()

function generateToken(params = {}) {
    return jwt.sign(params, authConfig.secret, {
        expiresIn: 86400
    })
}

router.post('/register', async (req, res) => {
    const { email } = req.body
    try {
        if(await User.findOne({ email }))
            return res.status(400).send({ error: 'User already exists' })

            
        const user = await User.create(req.body)
            
        // Removendo o retorno da password 'hasheada' de forma manual (mesmo que o model defina um 'select: false')
        user.password = undefined
        
        return res.send({ 
            user,
            token: generateToken({ id: user.id }) 
         })
    } catch (error) {
        console.log(`>>> Error at creating new user ${error}`);
        return res.status(400).send({ error: 'Registration failed' })
    }
})

router.post('/authenticate', async (req, res) => {
    const { email, password } = req.body
    // Recuperando asenha, que é omitida pelo model (segurança)
    const user = await User.findOne({ email }).select('+password').then((user) => {
        return user
    }).catch((error) => {
        console.log(`>>> Erro ao procurar no BD :: ${error}`);
        return res.status(400).send({ error: 'Database is not avaliabe :(' })
    })

    if(!user)
        return res.status(400).send({ error: 'User not found' })

    // Comparando e recuperando senha
    if(!await bcrypt.compare(password, user.password))
        return res.status(400).send({ error: 'Invalid password' })
    
    // Omitindo o password 'hasheado' da response
    user.password = undefined

    res.send({ 
        user, 
        token: generateToken({ id: user.id }) 
    })
})

// Recuperando o 'app' parametrizado na raiz do projeto (/auth/{rota})
module.exports = app => app.use('/auth', router)