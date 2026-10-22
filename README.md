# Quiromancia

## Estructura

- `backend/`: API Express, controladores, modelos, rutas, servicios y pruebas.
- `frontend/`: archivos fuente de la interfaz servida por Express.
- `docs/`: copia publicable del frontend para GitHub Pages.
- `scripts/`: tareas de mantenimiento del proyecto.
- `package.json`, `package-lock.json` y `render.yaml`: configuración de ejecución y despliegue.

## Desarrollo

Requiere Node.js 22 o superior. Configura las variables locales en `.env`; no publiques ese archivo.
La conexión de MongoDB usa la base `NUMEROLOGIA`; puedes cambiar el nombre con `MONGO_DB_NAME`. Al conectar, la aplicación crea las colecciones de usuarios, matrices numerológicas, prompts, lecturas de IA y bitácora de transacciones si todavía no existen. `MONGO_URI` debe contener las credenciales válidas de tu servidor MongoDB.
El servidor escucha en `0.0.0.0` por defecto; puedes cambiar la dirección con `HOST` y el puerto con `PORT`.

```sh
npm install
npm run dev
```

Para actualizar los archivos que publica GitHub Pages:

```sh
npm run build:frontend
```

El servidor sirve directamente `frontend/`; `docs/` se mantiene como salida estática de publicación.
