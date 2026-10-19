# Defensa técnica

Las respuestas describen el código de esta API. Las comprobaciones que dependen de HTTP/MongoDB están identificadas como pendientes; no se inventan observaciones.

## 1. Regla del validator y ataque que bloquea

En [src/validators/promptsConfig.validator.js](../src/validators/promptsConfig.validator.js):

```js
body("prompt", "El prompt es obligatorio y máximo 2000 caracteres")
    .isString()
    .trim()
    .notEmpty()
    .isLength({ max: 2000 }),
```

Bloquea #4 con `"   "` porque recorta antes de `.notEmpty()`, #3 si el valor no es string y #6 cuando excede 2.000 caracteres. Una prueba local con 10.000 caracteres verifica que la regla genera error. No hubo petición HTTP al compañero en esta sesión.

## 2. Regla que comprueban validator y schema

El validator de usuarios exige una fecha ISO:

```js
body("fechaNacimiento", "La fecha de nacimiento es obligatoria")
    .isString()
    .notEmpty()
    .isISO8601(),
```

Está en [src/validators/usuario.validator.js](../src/validators/usuario.validator.js). El modelo declara el mismo campo como fecha en [models/usuarios.model.js](../models/usuarios.model.js):

```js
fechaNacimiento: { type: Date },
```

La primera capa comunica el error de entrada como 400 antes de guardar. El schema aporta otra barrera para escrituras que lleguen al modelo por otro camino. En esta sesión no se ejecutó una petición HTTP con fecha mal formada; es una lectura del código, no una observación de la API en vivo.

## 3. Ataque #12: referencia a la nada

El validator de matriz combina formato válido y existencia del usuario en [src/validators/matriz.validator.js](../src/validators/matriz.validator.js):

```js
body("usuario_id", "El usuario_id es obligatorio")
    .notEmpty()
    .isMongoId()
    .bail()
    .custom(usuarioExists),
```

La decisión es comprobar existencia en el límite HTTP para devolver error de entrada antes de llamar al controller; `ref`/`populate` de Mongoose no establecen por sí solos integridad referencial. No se logró enviar esa petición esta sesión por bloqueo de sockets; por tanto, no afirmo cuál fue su respuesta HTTP ni el resultado de `populate`.

## 4. Ataque #14: PUT con un solo campo

En [controllers/matricesNumerologicas.controller.js](../controllers/matricesNumerologicas.controller.js):

```js
const updateData = Object.fromEntries(
    Object.entries({ usuario_id, numeroVida, numeroDestino, descripcion, resultado })
        .filter(([, value]) => value !== undefined)
);
const matriz = await MatrizNumerologica.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
);
```

Así solo se pasan los campos presentes y admitidos, en vez de depender del manejo de claves `undefined`. Una prueba local del controller con solo `descripcion` confirmó que ese es el único campo enviado a Mongoose. No se consultó un documento persistido antes y después, así que no puedo declarar observado el comportamiento real de MongoDB en este ataque.

## 5. Protección de mass assignment y `strict`

En [controllers/promptsConfig.controller.js](../controllers/promptsConfig.controller.js), la creación extrae una allowlist de campos y la actualización usa:

```js
const { nombre, prompt, descripcion, categoria, tipo_lectura, creadoPor } = req.body;
const updateData = Object.fromEntries(
    Object.entries({ nombre, prompt, descripcion, categoria, tipo_lectura, creadoPor })
        .filter(([, value]) => value !== undefined)
);
```

`activo` no forma parte de la lista y no se pasa al modelo en ninguna de esas operaciones. `strict: true` solo elimina campos que no estén declarados en el schema. `activo` sí está declarado en [models/promptsConfig.model.js](../models/promptsConfig.model.js), así que strict mode no decide los permisos del cliente. Las pruebas locales de los controllers verifican POST y PUT con `activo:false`; falta probar HTTP más GET en una base con fixtures.

## 6. Falla que más costó entender

Al configurar `checkExact`, se pasó inicialmente el objeto de opciones como primer argumento. La función interpreta ese lugar como cadenas de validación; opciones va en el segundo argumento. Las pruebas mostraron `Cannot read properties of undefined (reading 'build')`. La forma correcta, usada por ejemplo en [src/validators/usuario.validator.js](../src/validators/usuario.validator.js), es:

```js
checkExact(undefined, { locations: ["body"] }),
```

La suite volvió a pasar después de corregir la firma. La dificultad era que el error aparecía dentro de `runAllChains`, no como un mensaje directo indicando el argumento mal colocado.

## 7. Integración de Gemini

1. **Separación por capas:** el controller valida que haya un prompt activo y una matriz, consulta si ya existe una lectura y coordina el guardado. `src/services/IA.js` es quien construye la llamada al proveedor y valida su respuesta. Así, cambiar de proveedor o probar el parseo no requiere duplicar llamadas en el controller.
2. **Latencia:** el `POST /lecturasIA` es síncrono y espera la respuesta de Gemini, por lo que puede superar el timeout del cliente o del proxy. Para trabajos largos se puede responder `202 Accepted` con un ID de trabajo y consultar su estado, o enviar el resultado mediante webhook; un límite de tiempo y reintentos controlados también ayudan.
3. **Errores del proveedor:** el controller devuelve `503 Service Unavailable` si Gemini falla o responde con JSON inválido; `500` queda para fallos internos, como persistencia. Separarlos permite a los clientes reintentar fallos externos sin interpretar un error de código como una caída del proveedor.
4. **Persistencia:** `respuesta`, `analisis` y `resultado` son campos declarados para validar y consultar el contenido principal. `metadata` es `Mixed` porque contiene información auxiliar del modelo y la fecha de generación, que no necesita consultas tipadas. Un schema estricto para metadata facilitaría validación a cambio de flexibilidad.
5. **Lecturas repetidas:** el endpoint busca una lectura existente por usuario, versión de la plantilla, matriz y versión de la matriz antes de llamar al modelo. Una repetición devuelve la lectura guardada (`cached: true`); si cambian la plantilla o la matriz, se genera otra lectura. Un índice único también evita persistir duplicados en solicitudes concurrentes.

La petición de creación solo necesita `prompt_usado_id`; el usuario se identifica con el JWT y no acepta la plantilla ni el texto generado desde el cliente. Las lecturas se consultan y guardan por el usuario autenticado. `GEMINI_API_KEY` se configura en el entorno del servidor, nunca en el frontend.
