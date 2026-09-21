import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { cnxmongo, estadoMongo } from './database/cnxmongo.js';
import apiRouter from './routes/index.js';
import { auditarPeticion } from './middlewares/auditoria.js';
import { manejarErrores } from './middlewares/errores.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'docs')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/api/v1', auditarPeticion);
app.use('/api/v1', apiRouter);

app.get('/health', (_req, res) => {
  const database = estadoMongo();
  res.status(database.connected ? 200 : 503).json({ ok: database.connected, service: 'Quiromancia API', database });
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(manejarErrores);

const start = async () => {
  try {
    await cnxmongo();
    app.listen(PORT, HOST, () => {
      console.log(`Servidor iniciado en http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    app.listen(PORT, HOST, () => {
      console.log(`Servidor iniciado en modo local en http://${HOST}:${PORT}`);
    });
  }
};

start();
