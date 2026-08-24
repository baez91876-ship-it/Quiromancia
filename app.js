import express from 'express'
import 'dotenv/config'
import { cnxmongo } from './database/cnxmongo.js'
import apiRouter from './routes/index.js'

const app = express()
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'

app.use(express.json())
app.use('/api/v1', apiRouter)
app.get('/', (req, res) => res.send('Bienvenidos a la Quiromancia!'))

const start = async () => {
    try {
        await cnxmongo()
        app.listen(PORT, HOST, () => {
            console.log(`Servidor iniciado en http://${HOST}:${PORT}`)
        })
    } catch (error) {
        console.error('No se pudo iniciar el servidor:', error)
        process.exit(1)
    }
}

start()


const usuarios = {

}


const lineaspalmares = {

}

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

const  salud = {

}

const  amor = {

}

const  trabajo = {

}

const  familia = {

}