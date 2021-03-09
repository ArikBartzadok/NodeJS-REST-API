const express = require('express')
const bodyParser = require('body-parser')
const PORT = process.env.PORT || 3000

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Repassando o objeto 'app', para que possa ser usado em outros arquivos de minha aplicação
require('./controllers/auth.controller')(app)

app.listen(3000, () => {
    console.log(`Server is running in the port: ${PORT}`)
})