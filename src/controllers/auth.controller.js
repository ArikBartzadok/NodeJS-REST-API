const express = require('express')

const User = require('../models/User')

const router = express.Router()

router.post('/register', async (req, res) => {
    const { email } = req.body
    try {
        if(await User.findOne({ email }))
            return res.status(400).send({ error: 'User already exists' })

            
        const user = await User.create(req.body)
            
        // Removendo o retorno da password 'hasheada' de forma manual (mesmo que o model defina um 'select: false')
        user.password = undefined
        
        return res.send({ user })
    } catch (error) {
        console.log(`>>> Error at creating new user ${error}`);
        return res.status(400).send({ error: 'Registration failed' })
    }
})

// Recuperando o 'app' parametrizado na raiz do projeto (/auth/{rota})
module.exports = app => app.use('/auth', router)