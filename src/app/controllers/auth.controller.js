const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const authConfig = require('../../config/auth')
const mailer = require('../../modules/mailer')

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

router.post('/forgot_password', async (req, res) => {
    const { email } = req.body
    try {
        const user = await User.findOne({ email })
        if(!user)
            return res.status(400).send({ error: 'User not found'})
        // Gerando token específico para este usuário, para esta requisição, e com expiração (1 hora)
        const token = crypto.randomBytes(20).toString('hex')
        const now = new Date()
        now.setHours(now.getHours() + 1)
        // Salvando no modelo de usuários
        await User.findByIdAndUpdate(user.id, {
            '$set': {
                passwordResetToken: token,
                passwordResetExpires: now
            }
        }, { new: true, useFindAndModify: false })
        // Enviando email para o usuário que requisitou a recuperação
        mailer.sendMail({
            to: email,
            from: 'teste@teste.com',
            template: 'auth/forgot_password',
            context: { token }
        }, (error) => {
            console.log('<<<< '+error)
            if(error)
                return res.status(400).send({ error: 'Cannot send forgot password email' })
            return res.send()
        })
    } catch (error) {
        res.status(400).send({ error: 'Error on forgot password, try again'})
    }
})

router.post('/reset_password', async (req, res) => {
    const { email, token, password } = req.body

    try{
        const user = await User.findOne({ email })
            .select('+passwordResetToken passwordResetExpires') // Requerindo o retorno de ambos os campos, uma vez ocultados no modelo
        if(!user)
            return res.status(400).send({ error: 'User not found'})
        if(token !== user.passwordResetToken)
            return res.status(400).send({error: 'Token invalid'})
        const now = new Date()
        if( now > user.passwordResetExpires)
            return res.status(400).send({error: 'Token expired, generate a new one'})
        user.password = password
        await user.save()
        res.send() // OK 200
    } catch (error) {
        res.status(400).send({ error : 'Cannot reset password, try again'})
    }
})

// Recuperando o 'app' parametrizado na raiz do projeto (/auth/{rota})
module.exports = app => app.use('/auth', router)