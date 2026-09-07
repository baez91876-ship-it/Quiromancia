import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { cnxmongo } from './database/cnxmongo.js';
import apiRouter from './routes/index.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/v1', apiRouter);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'Quiromancia API' });
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
