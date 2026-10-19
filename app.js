import express from 'express';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { cnxmongo, estadoMongo } from './database/cnxmongo.js';
import { geminiConfigured } from './config/gemini.js';
import { asegurarPromptPredeterminado } from './database/seedPrompts.js';
import apiRouter from './routes/index.js';
import { auditarPeticion } from './middlewares/auditoria.js';
import { manejarErrores } from './middlewares/errores.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/api/v1', auditarPeticion);
  app.use('/api/v1', apiRouter);

  app.get('/health', (_req, res) => {
    const database = estadoMongo();
    res.status(database.connected ? 200 : 503).json({
      ok: database.connected,
      service: 'Quiromancia API',
      database,
      integrations: { gemini: { configured: geminiConfigured } },
    });
  });

  app.use(manejarErrores);
  return app;
};

export const start = async (app = createApp()) => {
  const port = Number(process.env.PORT) || 3000;
  const host = '0.0.0.0';
  const localUrl = `http://localhost:${port}`;
  if (!geminiConfigured) {
    console.warn('GEMINI_API_KEY no está configurada; las solicitudes de generación responderán 503.');
  }
  try {
    const connected = await cnxmongo();
    if (connected) {
      await asegurarPromptPredeterminado();
    }
    app.listen(port, host, () => {
      console.log(`Servidor iniciado en ${localUrl}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    app.listen(port, host, () => {
      console.log(`Servidor iniciado en modo local en ${localUrl}`);
    });
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  void start();
}
