import 'dotenv/config'
import express from 'express'
import { cnxmongo } from './database/cnxmongo.js'

const app = express()

app.get('/', (req, res) => res.send('Bienvenidos a la Quiromancia!'))

const PORT = process.env.PORT || 3000

await cnxmongo()

app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`)
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

