import express from 'express';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import 'dotenv/config';
import { cnxmongo, estadoMongo } from './database/cnxmongo.js';
import { asegurarColecciones } from './database/asegurarColecciones.js';
import { geminiConfigured } from './config/gemini.js';
import { asegurarPromptPredeterminado } from './database/seedPrompts.js';
import apiRouter from './routes/index.js';
import { auditarPeticion } from './middlewares/auditoria.js';
import { manejarErrores } from './middlewares/errores.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultAllowedOrigins = [
  'https://baez91876-ship-it.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const createCorsMiddleware = () => {
  const allowedOrigins = new Set(
    (process.env.CORS_ORIGINS || defaultAllowedOrigins.join(','))
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );

  return (req, res, next) => {
    const origin = req.get('Origin');
    if (!origin) return next();
    if (!allowedOrigins.has(origin)) {
      if (req.method === 'OPTIONS') {
        return res.status(403).json({ error: 'Origen no permitido' });
      }
      return next();
    }

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, x-api-key');
    res.vary('Origin');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  };
};

export const createApp = () => {
  const app = express();
  app.use(createCorsMiddleware());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.resolve(__dirname, '../frontend')));
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

export const start = (app = createApp()) => {
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '0.0.0.0';
  const localUrl = `http://localhost:${port}`;
  if (!geminiConfigured) {
    console.warn('GEMINI_API_KEY no está configurada; las solicitudes de generación responderán 503.');
  }
  const server = app.listen(port, host, () => {
    console.log(`Servidor escuchando en ${host}:${port} (local: ${localUrl})`);
    void cnxmongo()
      .then(async (connected) => {
        if (!connected) {
          console.warn('MongoDB no está conectado; revisa MONGO_URI, las credenciales y el acceso de red de Atlas.');
          return;
        }

        console.log('Conexión a MongoDB establecida exitosamente.');
        try {
          await asegurarColecciones();
          await asegurarPromptPredeterminado();
        } catch (error) {
          console.error('No se pudo preparar la base de datos:', error.message);
        }
      })
      .catch((error) => {
        console.error('No se pudo conectar a MongoDB:', error.message);
      });
  });
  return server;
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  void start();
}
