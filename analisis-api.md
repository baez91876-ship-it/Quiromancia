# Análisis de la API — Anatomía de tu propia API

## Alcance y método

Este análisis usa el código actual de este repositorio. Las comprobaciones HTTP se hicieron en una instancia Express aislada que montó los routers y middlewares reales, sin conectar a la URI guardada en `.env`. También se probaron `validarCampos`, el orden de rutas, un documento Mongoose en memoria, el error de referencia no registrada y el controller de prompts con la conexión desactivada.

No se dispuso de una base MongoDB de prueba con documentos semilla. Por eso los resultados de consultas pobladas exitosas, relaciones huérfanas consultadas en Mongo y el número de comandos capturados con `mongoose.set("debug", true)` se identifican como predicciones, no como mediciones. El código fuente no se modificó durante estas comprobaciones.

## Bloque 1 — El viaje de una petición

### Reto 1.1 — El mapa

**Petición elegida:** `GET /api/v1/matricesNumerologicas/completa/<ID_MONGO_EXISTENTE>`. La ruta existe en [routes/matricesNumerologicas.routes.js](routes/matricesNumerologicas.routes.js#L18) y el controller ejecuta `findById(id).populate("usuario_id")` en [controllers/matricesNumerologicas.controller.js](controllers/matricesNumerologicas.controller.js#L70). El campo es una referencia `ObjectId` al modelo `Usuario`, según [models/matricesNumerologicas.model.js](models/matricesNumerologicas.model.js#L4) y [models/usuarios.model.js](models/usuarios.model.js#L14).

| Orden | Parada | Qué hace y qué entrega |
| --- | --- | --- |
| 1 | Postman | Envía un GET con un ID de matriz existente. En la respuesta recibe status y JSON. |
| 2 | Socket/puerto | La petición llega al host y puerto donde escucha Node; en un túnel, Dev Tunnels reenvía el tráfico a ese puerto. El túnel no es código del repositorio. |
| 3 | Express en [app.js](app.js#L22) | El `apiRouter` está montado bajo `/api/v1`; Express elimina ese prefijo al delegar la ruta y conserva `/matricesNumerologicas/completa/:id`. |
| 4 | [routes/index.js](routes/index.js#L12) | El router principal deriva `/matricesNumerologicas` al router de matrices. |
| 5 | [routes/matricesNumerologicas.routes.js](routes/matricesNumerologicas.routes.js#L18) | Coincide `GET /completa/:id` y ejecuta, en orden, `idValidator`, `validarCampos` y `getMatrizConUsuario`. |
| 6 | [src/validators/id.validator.js](src/validators/id.validator.js#L4) | Comprueba que `id` tenga formato Mongo ObjectId. Si pasa, llama `next()` y deja continuar la cadena. |
| 7 | [src/middlewares/validarCampos.js](src/middlewares/validarCampos.js#L4) | Lee los errores acumulados por `express-validator`; sin errores llama `next()` hacia el controller. |
| 8 | [controllers/matricesNumerologicas.controller.js](controllers/matricesNumerologicas.controller.js#L67) | Extrae el ID de `req.params`, construye la consulta Mongoose y solicita poblar `usuario_id`. |
| 9 | Mongoose | Envía a MongoDB la consulta del documento principal y resuelve la referencia `Usuario` indicada por el schema. El ObjectId devuelto para `usuario_id` se sustituye en el resultado en memoria por el documento encontrado. |
| 10 | MongoDB | Busca la matriz en su colección y el usuario referenciado en la colección de usuarios; devuelve los documentos a Mongoose. MongoDB no hace un JOIN relacional. |
| 11 | Controller | Si no encuentra la matriz, responde 404; si la encuentra, responde `200` con la matriz. El `populate` exitoso incluiría el usuario en `usuario_id`. |
| 12 | Express y Postman | Express serializa el documento Mongoose como JSON y lo devuelve al cliente. |

**Predicción:** con una matriz y su usuario existentes, la respuesta será 200 y `usuario_id` contendrá un objeto de usuario, no solo el ObjectId.

**Comprobación:** no ejecuté este GET con éxito porque no hay una base de prueba con una matriz y un usuario semilla disponibles. Sí confirmé sin persistir datos que una instancia Mongoose guarda `usuario_id` como `ObjectId`; el resultado fue `stored ref type: ObjectId` y un valor hexadecimal de 24 caracteres.

**Explicación:** `populate()` transforma la representación devuelta por la consulta en memoria. No cambia el tipo almacenado en MongoDB.

### Reto 1.2 — El mismo viaje, pero fallando

**Predicción previa:** `GET /api/v1/matricesNumerologicas/completa/123abc` coincidirá con la misma ruta; `idValidator` agregará un error, `validarCampos` responderá 400 y el controller/MongoDB no se ejecutarán.

**Comprobación ejecutada:** monté el router real de matrices y envié la petición sin conectar MongoDB. Resultado:

```text
GET /api/v1/matricesNumerologicas/completa/123abc
400 application/json
{"errors":[{"type":"field","value":"123abc","msg":"El id no es válido","path":"id","location":"params"}]}
```

**Explicación:** el camino se separa del exitoso en `idValidator`: el formato inválido se guarda en el resultado de validación. Después, `validarCampos` responde y hace `return`; no llama a `next()`. Por eso no se ejecuta `getMatrizConUsuario`, no se construye `findById` y no se consulta MongoDB. Referencias: [id.validator.js](src/validators/id.validator.js#L4), [validarCampos.js](src/middlewares/validarCampos.js#L4) y [la ruta](routes/matricesNumerologicas.routes.js#L18).

### Reto 1.3 — Comprobación con logs temporales

No inserté logs en el código persistente. Este es el orden de logs esperado si se instrumentan temporalmente el middleware de ruta, `idValidator`, `validarCampos` y el controller:

```text
GET válido:
[llegué a ruta GET completa]
[llegué a idValidator]
[llegué a validarCampos]
[llegué a getMatrizConUsuario]
[consulta Mongoose/populate]

GET con /123abc:
[llegué a ruta GET completa]
[llegué a idValidator]
[llegué a validarCampos]
[respuesta 400]
```

La última línea del camino válido requiere una Mongo de prueba y un documento existente; no se observó en esta sesión. En el caso inválido el resultado HTTP anterior confirma que controller y base no se alcanzan. Para hacer visible “llegué a ruta”, hay que añadir un middleware de log a esa definición de ruta; Express no genera automáticamente un log de coincidencia.

## Bloque 2 — ¿Quién es responsable de qué?

### Reto 2.1 — Tabla de responsabilidades

| # | Responsabilidad | Fragmento real y ubicación |
| --- | --- | --- |
| 1 | Campo obligatorio en persistencia | `nombre: { type: String, required: true, trim: true }` — [models/usuarios.model.js](models/usuarios.model.js#L4). También hay campos requeridos en otros schemas. |
| 2 | Rechazo de campo ausente antes del controller/BD | `body("nombre", "El nombre es obligatorio").trim().notEmpty()` — [src/validators/usuario.validator.js](src/validators/usuario.validator.js#L4); `if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });` — [src/middlewares/validarCampos.js](src/middlewares/validarCampos.js#L4). |
| 3 | POST `/usuarios` se asocia al controller de creación | `router.post("/", usuarioCreateValidator, validarCampos, createUsuario)` — [routes/usuarios.routes.js](routes/usuarios.routes.js#L18). |
| 4 | Lectura del JSON del body | `app.use(express.json());` — [app.js](app.js#L16). También hay un segundo parser en [routes/index.js](routes/index.js#L10). |
| 5 | Status de éxito en creación de usuario | `return res.status(201).json(usuarioSinPassword);` — [controllers/usuarios.controller.js](controllers/usuarios.controller.js#L19). |
| 6 | Status cuando un documento no existe | `if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });` — [controllers/usuarios.controller.js](controllers/usuarios.controller.js#L39). Las lecturas, matrices, prompts y bitácoras tienen comprobaciones análogas. |
| 7 | Conexión MongoDB | `return mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, ... })` — [database/cnxmongo.js](database/cnxmongo.js#L19). Los reintentos están en [cnxmongo.js](database/cnxmongo.js#L32). |
| 8 | Campo que apunta a otra colección | `usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true }` — [models/matricesNumerologicas.model.js](models/matricesNumerologicas.model.js#L4). |
| 9 | Sustitución de ObjectId por documento poblado | `MatrizNumerologica.findById(id).populate("usuario_id")` — [controllers/matricesNumerologicas.controller.js](controllers/matricesNumerologicas.controller.js#L70). |
| 10 | Prefijo global de la API | `app.use('/api/v1', apiRouter);` — [app.js](app.js#L22); los prefijos de colección se montan en [routes/index.js](routes/index.js#L11). |
| 11 | Impedir autoasignación de campos ajenos | No hay una comprobación general de identidad/propiedad. Por ejemplo, el controller acepta `creadoPor` del body — [controllers/promptsConfig.controller.js](controllers/promptsConfig.controller.js#L5) — y el validator solo comprueba que el ObjectId exista — [src/validators/promptsConfig.validator.js](src/validators/promptsConfig.validator.js#L17). |
| 12 | Recoger errores del validator y formar 400 | `validationResult(req)` y respuesta `res.status(400).json({ errors: errors.array() })` — [src/middlewares/validarCampos.js](src/middlewares/validarCampos.js#L4). |

### Reto 2.2 — Lo que no está en ninguna parte

1. **Autorización/propiedad de los recursos:** hay login y JWT, pero las rutas CRUD no montan middleware de token. La API permite listar colecciones y el body puede seleccionar `usuario_id`/`creadoPor`; validar que el usuario exista no demuestra que sea quien realiza la petición. La responsabilidad debería vivir en middleware de autenticación más filtros de propiedad en las consultas.
2. **Mass assignment de propietario:** controllers como prompts y matrices aceptan IDs de usuario enviados por el cliente. Debería derivarse el propietario de una identidad verificada o autorizarse el cambio explícitamente; no basta con `isMongoId()` ni `Usuario.findById()`.
3. **404 JSON para rutas/métodos no definidos:** no hay un middleware final de not-found después de las rutas. Express termina generando su 404 HTML predeterminado. Debería agregarse un handler JSON después de `apiRouter` y antes del middleware de errores.
4. **405 Method Not Allowed explícito:** no se registra un handler por ruta existente con método incorrecto; ese caso también cae en el 404 predeterminado. Si el contrato requiere 405, debe añadirse en una capa final de rutas.
5. **Consistencia de errores:** `middlewares/errores.js` convierte errores Mongoose recibidos por `next(err)`, pero la mayoría de controllers captura excepciones y devuelve directamente `error.message`; esos errores nunca alcanzan el middleware global. La política de errores debería centralizarse en controller/helper o middleware.
6. **Integridad referencial al borrar:** los validators de creación comprueban algunas referencias, pero borrar un usuario/prompt no elimina ni bloquea todos los documentos que lo referencian. La capa de servicio/controller debería definir explícitamente restricción, cascada o referencia nula.

### Reto 2.3 — Lógica en el lugar equivocado

- Los checks de formato (`isMongoId`, `isEmail`, `isISO8601`, enums) están en validators, que es la capa adecuada: [id.validator.js](src/validators/id.validator.js#L4) y [usuario.validator.js](src/validators/usuario.validator.js#L4).
- Los validators también consultan Mongo para verificar referencias, por ejemplo `Usuario.findById(id)` en [lectura.validator.js](src/validators/lectura.validator.js#L5). Es una regla de existencia asociada al input; debe tenerse en cuenta que una desconexión de BD durante esa consulta puede producir un error de validación poco claro.
- `createLecturaIA` comprueba que el prompt esté activo y que exista una matriz antes de crear la lectura: [lecturasIA.controller.js](controllers/lecturasIA.controller.js#L10). Son reglas de negocio relacionadas con la operación, por lo que pueden vivir en un servicio si se reutilizan o crecen.
- Los controllers repiten bloques `try/catch` y exponen `error.message`; ejemplos: [matricesNumerologicas.controller.js](controllers/matricesNumerologicas.controller.js#L9), [promptsConfig.controller.js](controllers/promptsConfig.controller.js#L9) y [bitacoraTransacciones.controller.js](controllers/bitacoraTransacciones.controller.js#L9). Es repetición y fuga potencial de detalles internos.
- Las actualizaciones construyen objetos con propiedades posiblemente `undefined`, como `findByIdAndUpdate(id, { nombre, prompt, ... })` en [promptsConfig.controller.js](controllers/promptsConfig.controller.js#L38). Mongoose suele omitir propiedades `undefined` en updates, pero el comportamiento debe comprobarse con el test del reto 14; una alternativa explícita sería construir un objeto solo con claves enviadas.

## Bloque 3 — Autopsia de respuestas

### Reto 3.1 — HTTP 500 por CastError de ObjectId

**Predicción:** un `GET /api/v1/matricesNumerologicas/completa/123abc` no debería producir CastError, porque la ruta ejecuta `idValidator` antes del controller. Espero 400 JSON.

**Comprobación:** petición contra el router real, con Mongo desconectado: 400 JSON con `"msg":"El id no es válido"` (resultado completo en el reto 1.2).

**Explicación:** si se observa el texto `Cast to ObjectId failed...`, lo creó Mongoose al castear una consulta ejecutada con un ID inválido; no lo genera Express. Para una entrada inválida, 400 es el status adecuado. En este endpoint el validator evita que esa consulta se ejecute; el 500 del ejemplo no es el comportamiento de la ruta actual. Mostrar el texto de Mongoose expone nombres internos de modelos/operaciones y detalles de implementación. Referencias: [id.validator.js](src/validators/id.validator.js#L4), [matrices.routes.js](routes/matricesNumerologicas.routes.js#L18) y [matrices controller](controllers/matricesNumerologicas.controller.js#L25).

### Reto 3.2 — HTTP 200 con `null`

**Respuesta del repositorio:** no encontré un controller que responda `200` con `null` para un documento inexistente. Por ejemplo, matriz inexistente ejecuta `return res.status(404).json({ error: "Matriz numerológica no encontrada" })` en [controllers/matricesNumerologicas.controller.js](controllers/matricesNumerologicas.controller.js#L27).

**Predicción alternativa:** si un controller hiciera `res.status(200).json(documento)` sin comprobar `documento`, Mongoose podría serializar `null` con status 200.

**Comprobación:** no hay esa rama en los controllers inspeccionados; no se simuló una consulta a Mongo porque no hay base de prueba. El cliente que recibe 200/null podría interpretarlo como objeto válido y fallar al leer propiedades, o confundir “no existe” con “existe vacío”. La comprobación `if (!documento)` debe ocurrir antes de responder.

### Reto 3.3 — HTTP 400 de express-validator

El texto inicial nace en una cadena de validator, por ejemplo `"El id no es válido"` en [src/validators/id.validator.js](src/validators/id.validator.js#L4). `validationResult(req)` recoge los errores acumulados en [src/middlewares/validarCampos.js](src/middlewares/validarCampos.js#L4), y en la línea siguiente se convierten en respuesta JSON con status 400: [validarCampos.js](src/middlewares/validarCampos.js#L6).

**Comprobación:** para `123abc`, la respuesta real fue `400 application/json` con array `errors`, como se documentó en el reto 1.2.

### Reto 3.4 — HTTP 404 `Cannot POST ...` sin JSON

**Predicción:** un método/ruta no registrado no alcanzará controller ni middleware de errores; Express responderá con su handler final en HTML.

**Comprobación:** en el harness con las rutas reales envié `POST /api/v1/no-existe`; recibí status 404, `text/html; charset=utf-8` y `<pre>Cannot POST /api/v1/no-existe</pre>`.

**Explicación:** no es una excepción que llegue a `manejarErrores`; es una ruta no coincidente y la aplicación no define un not-found JSON después de `apiRouter`. Para responder JSON, agregar un middleware final como `app.use((req,res) => res.status(404).json({ error: "Ruta no encontrada" }))` antes de `app.use(manejarErrores)`. El middleware global actual está en [app.js](app.js#L33) y maneja errores que reciben `next(err)`, no rutas ausentes.

### Reto 3.5 — Error mal gestionado propio

**Experimento:** invoqué el controller real `createPromptConfig` con datos estructuralmente válidos, pero con Mongoose desconectado y `bufferCommands=false`. No fue una petición HTTP completa, sino una simulación directa del controller para no tocar una base real.

**Respuesta observada:**

```text
status: 500
{"error":"Cannot call `promptconfigs.insertOne()` before initial connection is complete if `bufferCommands = false`. Make sure you `await mongoose.connect()` if you have `bufferCommands = false`."}
```

**Problema:** el `catch` de [controllers/promptsConfig.controller.js](controllers/promptsConfig.controller.js#L9) envía `error.message` al cliente. El mensaje revela colección, operación y configuración interna; el controller debería registrar el detalle internamente y devolver una respuesta genérica y estable. El status 500 describe indisponibilidad interna, no una entrada inválida del cliente.

## Bloque 4 — Qué hace realmente el servidor

### Reto 4.1 — `express.json()`

**Predicción:** al quitar `app.use(express.json())`, el parser no poblará `req.body` con el JSON enviado. Un controller/validator que espera campos del body verá valores ausentes; no es que el JSON se convierta automáticamente en variables.

**Explicación de la línea:** [app.js](app.js#L16) registra middleware de Express/body-parser. Lee el stream HTTP cuando el `Content-Type` corresponde a JSON, analiza el texto y deja el resultado en `req.body`; luego llama `next()` para continuar.

**Comprobación del efecto del parser:** el parser se verificó como parte del flujo Express; no comenté la línea del repositorio ni levanté la app completa. El efecto en las rutas propias se deduce del orden visible: parser en [app.js](app.js#L16), luego router en [app.js](app.js#L22), y validators/controllers que leen `req.body`, por ejemplo [usuarios.validator.js](src/validators/usuario.validator.js#L4) y [usuarios.controller.js](controllers/usuarios.controller.js#L9).

### Reto 4.2 — El orden sí importa

**Predicción:** si `express.json()` se registra después de `app.use('/api/v1', apiRouter)`, el router y sus validators reciben la petición antes de que corra el parser. Un POST con JSON puede aparecer sin campos y ser rechazado como incompleto. Middleware posterior no vuelve hacia atrás ni reejecuta una ruta ya respondida.

**Comprobación:** el orden actual es parser en `app.js` línea 16 y router en línea 22. El parser está además duplicado dentro del router principal en [routes/index.js](routes/index.js#L10); mover ambos después de sus rutas sería incorrecto. No cambié el orden en la aplicación permanente.

### Reto 4.3 — `next()`

En [src/middlewares/validarCampos.js](src/middlewares/validarCampos.js#L4), si hay errores se envía 400 y `return` termina esa rama; si no hay errores, la línea 8 llama `next()` para que Express ejecute el siguiente middleware/controller.

- **Predicción si se borra `next()`:** la petición válida no recibe respuesta de ese middleware ni llega al controller y queda pendiente.
- **Por qué está fuera del `if`:** es el camino sin errores; el `return` interno ya finaliza el camino de error.
- **Por qué no llama a `next()` después del 400:** `next()` permitiría continuar y podría intentar escribir una segunda respuesta.
- **Comprobación:** con el middleware real y una regla `body("dato").notEmpty()`, `{}` devolvió 400 JSON; `{"dato":"ok"}` llegó al siguiente handler y devolvió 200. La salida fue `400 {"errors":[...]}` y `200 {"paso":"controller","dato":"ok"}`.

### Reto 4.4 — Middleware de cuatro parámetros

La firma real es `(error, _req, res, _next)` en [middlewares/errores.js](middlewares/errores.js#L1). Express reconoce el middleware de errores por sus cuatro parámetros; aunque `_next` no se use, quitarlo puede hacer que Express lo trate como middleware normal y no lo invoque para errores.

El middleware está después de rutas y parsers en [app.js](app.js#L33), para recibir errores que se propaguen con `next(error)` o rechazos de middleware async. Un JSON inválido del parser es un ejemplo real: en la simulación respondió `400 {"error":"El cuerpo JSON no es válido"}` y el error detallado apareció solo en la consola. El middleware no reemplaza el handler de 404 para rutas que no coinciden.

### Reto 4.5 — El orden de las rutas

**Predicción:** si `router.get('/:id', ...)` precede a `router.get('/activos', ...)`, `GET /activos` coincide primero con `/:id`. En este proyecto, un `idValidator` sobre ese parámetro rechazaría `activos` como ID no válido.

**Comprobación:** monté ambas rutas con el validator real, en los dos órdenes. Con `/:id` primero, `/activos` devolvió 400 `Invalid value`; con `/activos` primero, devolvió 200 desde el handler literal.

**Orden correcto:** registrar primero rutas estáticas/específicas (`/activos`, `/completa/:id`) y luego rutas genéricas (`/:id`). En este repo ya se observa el patrón `/completa/:id` antes de `/:id` en [routes/matricesNumerologicas.routes.js](routes/matricesNumerologicas.routes.js#L18).

### Reto 4.6 — `app.listen()`

`app.listen(PORT, HOST, callback)` crea el servidor HTTP asociado a Express, enlaza un socket al puerto y permite que el proceso reciba conexiones. El event loop no termina porque el socket servidor queda abierto. En este repo el host es `0.0.0.0`; `app.listen()` está en las dos ramas de inicio, [app.js](app.js#L38) y [app.js](app.js#L43).

La llamada está después de `await cnxmongo()` en [app.js](app.js#L37): con URI válida pero inaccesible, la app espera los reintentos antes de escuchar. Un túnel de Port Forwarding es infraestructura externa que toma tráfico de una URL pública temporal y lo reenvía a un puerto local; no cambia las rutas Express. Si se marca público, cualquier persona con la URL puede alcanzar la API.

## Bloque 5 — Las relaciones por dentro

### Reto 5.1 — Qué guarda MongoDB realmente

En `MatrizNumerologica`, el schema define `usuario_id` como ObjectId con `ref: "Usuario"` — [models/matricesNumerologicas.model.js](models/matricesNumerologicas.model.js#L4). El GET poblado usa `.populate("usuario_id")` — [controllers/matricesNumerologicas.controller.js](controllers/matricesNumerologicas.controller.js#L70).

**Comprobación en memoria:** al crear una instancia Mongoose sin guardarla, `matriz.usuario_id.constructor.name` devolvió `ObjectId` y el valor fue un ID hexadecimal. Esto confirma el tipo del campo antes de persistir, no el contenido de una colección real.

**Predicción:** Compass/mongosh mostraría `usuario_id: ObjectId("...")`; el GET con populate devolvería `usuario_id` como el documento `Usuario`. Mongoose obtiene primero la matriz y resuelve después la referencia para el resultado de esa consulta. Populate no actualiza el documento guardado. La comparación real entre Mongo y el JSON queda pendiente de una BD semilla.

### Reto 5.2 — Cuántas veces se consulta la base

**Predicción para matrices:** un `findById` de matriz más una consulta para poblar `usuario_id`, normalmente dos consultas Mongoose/lecturas Mongo. **Para lectura detallada:** el query principal más consultas de populate para `usuario_id` y `prompt_usado_id`, normalmente tres consultas porque son modelos distintos; el controller está en [controllers/lecturasIA.controller.js](controllers/lecturasIA.controller.js#L95).

No se activó `mongoose.set("debug", true)` contra este repositorio porque no había una base de prueba con datos y no debía utilizarse la URI local desconocida. Por tanto, el conteo anterior es predicción del patrón de populate, no medición. MongoDB no hace un JOIN SQL: Mongoose ejecuta las consultas y combina los resultados en Node.js. Para verificar, activar temporalmente debug antes de las consultas y contar las operaciones impresas.

### Reto 5.3 — El nombre del `ref`

El modelo apunta exactamente al nombre registrado: `ref: "Usuario"` en [models/matricesNumerologicas.model.js](models/matricesNumerologicas.model.js#L4) y registro `mongoose.model("Usuario", usuarioSchema)` en [models/usuarios.model.js](models/usuarios.model.js#L14). Lecturas también referencia `PromptConfig` y `Usuario` en [models/lecturasIA.model.js](models/lecturasIA.model.js#L4).

**Predicción:** cambiar el ref a `"Usuarios"` sin registrar ese modelo provocará un `MissingSchemaError` durante populate.

**Comprobación:** con un schema Mongoose temporal y sin MongoDB, `document.populate("owner")` produjo exactamente:

```text
MissingSchemaError: Schema hasn't been registered for model "Usuarios".
Use mongoose.model(name, schema)
```

### Reto 5.4 — Populate anidado

No hay un populate anidado en los controllers actuales; la lectura detallada puebla dos referencias hermanas. Un caso aplicable con los refs existentes sería cargar una bitácora, poblar su `lectura_id` y desde esa lectura poblar `usuario_id` y `prompt_usado_id`:

```js
BitacoraTransaccion.findById(id).populate({
    path: "lectura_id",
    populate: [
        { path: "usuario_id" },
        { path: "prompt_usado_id" },
    ],
});
```

Mongoose consulta la bitácora, obtiene sus ObjectIds y después resuelve la lectura; a continuación consulta los refs de la lectura y arma el objeto anidado en Node.js. Si la lectura o uno de sus documentos relacionados ya no existe, el campo poblado correspondiente será `null`; hace falta comprobar ese caso con fixtures.

## Bloque 6 — El arranque

### Reto 6.1 — La secuencia

La guía menciona `index.js`, pero este repositorio arranca desde `app.js`: el script `dev` ejecuta `nodemon app.js` en [package.json](package.json#L17).

1. Nodemon inicia Node y vuelve a ejecutar `app.js` cuando detecta cambios.
2. Node carga el grafo ESM; `dotenv/config` aparece antes de los imports de conexión y rutas en [app.js](app.js#L4).
3. Se construye Express, se leen `PORT`/host y se registran parser, estáticos, auditoría, router API, health, ruta raíz y middleware de errores ([app.js](app.js#L10)).
4. Al final se llama `start()` ([app.js](app.js#L49)).
5. `start()` espera `cnxmongo()` ([app.js](app.js#L37)). La conexión puede reintentar hasta tres veces antes de devolver `false` ([database/cnxmongo.js](database/cnxmongo.js#L32)).
6. Si conecta o devuelve `false`, `app.listen()` empieza a escuchar ([app.js](app.js#L38)); si la conexión lanza (por ejemplo, falta `MONGO_URI`), se ejecuta la rama `catch` y también se llama a listen ([app.js](app.js#L41)).

### Reto 6.2 — Por qué dotenv va primero

**Predicción:** si `dotenv/config` se coloca después de los imports que ejecutan código de nivel superior que lee variables, esos módulos pueden capturar valores ausentes o defaults antes de cargar `.env`.

En este código, `middlewares/token.js` captura el secreto una sola vez al importarse: `const secretKey = process.env.SECRETORPRIVATEKEY || "casino_secret_key"` en [middlewares/token.js](middlewares/token.js#L5). `usuarios.routes.js` importa ese módulo indirectamente a través del router. Por eso dotenv debe evaluarse antes de importar el grafo de rutas.

**Comprobación:** no moví el import ni cambié el secreto en `.env`; no expuse su valor. La predicción se confirma inspeccionando la captura de `secretKey` al nivel del módulo y el orden actual de imports en `app.js`. En módulos ES, las dependencias estáticas se evalúan antes del cuerpo del módulo y su orden en el grafo importa; no es equivalente a ejecutar una función `require` dentro del cuerpo.

### Reto 6.3 — Si la base de datos no responde

**Predicción:** con una URI con esquema inválido, `mongoose.connect()` fallará; `cnxmongo()` registrará tres intentos, esperará cinco segundos entre ellos y devolverá `false`. Después, `app.js` continuará y abrirá el puerto, aunque la BD siga caída.

**Comprobación aislada:** ejecuté `cnxmongo()` con `MONGO_URI="not-a-valid-mongodb-uri"` y resolutor DNS local para no contactar servidores externos. Se observó el mensaje `Invalid scheme...`, los intentos `1/3`, `2/3`, `3/3`, dos esperas de cinco segundos y finalmente `cnxmongo result: false`.

**Explicación:** los timeout de conexión están configurados en [database/cnxmongo.js](database/cnxmongo.js#L19); el límite de intentos está en [cnxmongo.js](database/cnxmongo.js#L32), el catch reintenta en las líneas 41–48 y el retorno offline está en la línea 51. Como `start()` no comprueba el booleano, procede a `app.listen()` después del `await`. Es útil que el proceso no falle por completo, pero health responderá 503 y las operaciones que necesiten Mongo fallarán; para producción debe existir monitoreo y una política clara de readiness/reconexión.

### Reto 6.4 — `"type": "module"`

`"type": "module"` está en [package.json](package.json#L20) y hace que Node trate los `.js` del paquete como ES modules. Por eso el proyecto usa `import`/`export` y rutas relativas con extensión, por ejemplo [routes/index.js](routes/index.js#L1). Las dependencias de npm se resuelven mediante el mecanismo de paquetes y su `exports`/`main`, mientras que la resolución ESM de rutas relativas no agrega automáticamente `.js`.

Quitar `type` cambia el modo de interpretación según versión y detección de sintaxis de Node. En runtimes que traten `.js` ambiguo como CommonJS, `import` puede producir `Cannot use import statement outside a module`; en Node moderno con detección de sintaxis puede inferirse ESM y mostrar advertencias. No quité el campo ni ejecuté una copia del proyecto sin él; no afirmo un error universal sin fijar la versión de Node.

## Actividad final — Diseñar sin programar

### B. Paginar el listado de matrices

**Contrato HTTP propuesto**

- Método y ruta: `GET /api/v1/matricesNumerologicas?pagina=2&limite=10`.
- No requiere body. Conservar el esquema de acceso actual de la ruta (sin API key); decidir autenticación es un requisito aparte, porque hoy ese GET no la exige.
- `pagina`: entero decimal, mínimo 1; default 1.
- `limite`: entero decimal entre 1 y 100; default 10.
- Offset: `(pagina - 1) * limite`.
- Éxito `200`:

```json
{
  "data": [],
  "paginacion": {
    "pagina": 2,
    "limite": 10,
    "total": 27,
    "totalPaginas": 3
  }
}
```

- Si `pagina` está después de la última, responder 200 con `data: []`, manteniendo `total` y `totalPaginas`; no es un error de recurso.
- Si la colección está vacía, `total: 0`, `totalPaginas: 0` y `data: []`.
- `400 Bad Request`: `pagina`/`limite` no es entero, `pagina < 1`, `limite < 1` o `limite > 100`, con mensaje en español y campo inválido.
- `500 Internal Server Error`: error inesperado de consulta, respuesta genérica sin texto crudo de Mongo.

**Archivos afectados**

1. Modificar [routes/matricesNumerologicas.routes.js](routes/matricesNumerologicas.routes.js#L17) para asociar el GET de colección con su validator de query y controller.
2. Crear `src/validators/paginacion.validator.js` (o un validator local para matrices) con las reglas de `pagina` y `limite`.
3. Modificar [controllers/matricesNumerologicas.controller.js](controllers/matricesNumerologicas.controller.js#L15) para leer parámetros, calcular `skip`, consultar `countDocuments()` y devolver el contrato.
4. Añadir pruebas de query inválida, primera/última página, colección vacía y límite máximo.

**Campos restringidos**

El cliente solo controla `pagina` y `limite` en query. No debe enviar ni sobrescribir `_id`, `usuario_id`, `fecha`, `createdAt` o `updatedAt` como filtros/valores del update de paginación; la consulta usa `find().skip().limit()` y no un objeto de actualización del cliente.

**Relaciones**

Cada matriz tiene `usuario_id` con `ref: "Usuario"` en [models/matricesNumerologicas.model.js](models/matricesNumerologicas.model.js#L4), pero el listado actual no hace populate. Para paginar, devolver el ObjectId conserva el contrato actual y evita consultas adicionales. Si el diseño decide poblar el usuario, un ref huérfano se representaría como `usuario_id: null`; eso no debería fallar toda la página y debe cubrirse con una prueba.

**Caso límite no obvio**

Una colección puede cambiar entre el `countDocuments()` y el `find().skip().limit()`; el total y los elementos pueden reflejar instantes ligeramente distintos. La especificación acepta consistencia eventual de una página normal y no promete snapshot transaccional. Ordenar siempre por un campo estable (por ejemplo `_id: 1`) antes de aplicar skip/limit para que el mismo documento no cambie de página arbitrariamente entre solicitudes.
