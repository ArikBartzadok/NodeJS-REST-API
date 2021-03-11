const mongoose = require('mongoose')

mongoose.connect('mongodb://127.0.0.1:27017/noderest', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false}).then(() => {
    console.log('>>> Conectado ao mongo :) :: Success')
}).catch((error) => {
    console.log(`>>> Falha ao conectar ao mongo :( :: ${error}`)
})
mongoose.Promise = global.Promise

module.exports = mongoose