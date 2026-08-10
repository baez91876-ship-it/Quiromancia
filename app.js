import 'dotenv/config'
import express from 'express'
import { cnxmongo } from './database/cnxmongo.js'

const app = express()
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'

app.get('/', (req, res) => res.send('Bienvenidos a la Quiromancia!'))

app.listen(PORT, HOST, () => {
    console.log(`Servidor iniciado en http://${HOST}:${PORT}`)
})

const usuarios = [
]


const lineaspalmares = [

]
const perfilnumerologico = {

}

const lecturanumero = {
}

const alma = {

}
const interpretacion = {

}
const  destino = {
  
}

