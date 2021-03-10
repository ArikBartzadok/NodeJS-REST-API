const fs = require('fs')
const path = require('path')

module.exports = app => {
    // Capturando todos os arquivos que não sejam ocultos, e que não sejam o 'index' (este aqui)
    fs
        .readdirSync(__dirname)
        .filter(file => ((file.indexOf('.')) !== 0 && (file !== 'index.js')))
        .forEach(file => require(path.resolve(__dirname, file))(app))
}