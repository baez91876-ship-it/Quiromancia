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
id,
    nombre,
    correo,
    fecha_nacimiento,
    fecha_registro,
    genero,
}


const lineaspalmares = {
id,
    usuario_id,
    linea_vida,
    linea_corazon,
    linea_cabeza,
}

const perfilnumerologico = {
id,
    usuario_id,
    numero_vida,
    numero_expresion,
    descripcion,
}

const lecturanumero = {
id,
    usuario_id,
    fecha_lectura,
    resultado,
}

const alma = {
id,
    usuario_id,
    numero_alma,
    deseo_profundo,
}

const interpretacion = {
id,
    usuario_id,
    tipo_lectura,
    mensaje_general,
}

const  destino = {
id,
    usuario_id,
    numero_destino,
    camino_futuro,
}

const  salud = {
id,
    usuario_id,
    estado_energetico,
    recomendaciones,
}

const  amor = {
id,
    usuario_id,
    compatibilidad,
    prediccion_romantica,
}

const  trabajo = {
id,
    usuario_id,
    talentos_ocultos,   
    proyeccion_laboral,
}

const  familia = {
id,
    usuario_id,
    dinamica_hogar,
    lazos_karmicos,
}

const  espiritualidad = {
id,
    usuario_id,
    nivel_conciencia,
    guia_espiritual,
}
