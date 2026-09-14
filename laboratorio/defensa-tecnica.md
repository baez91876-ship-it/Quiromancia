# Defensa Técnica — Laboratorio de Ataque y Defensa

**Estudiante / Desarrollador:** Proyecto Quiromancia API
**Fecha:** 14 de Septiembre de 2026

---

## 1. Regla de Validator y Ataque que Bloquea

En el archivo [src/validators/id.validator.js](src/validators/id.validator.js#L3-L5) se definió la siguiente regla:

```javascript
import { param } from "express-validator";

export const idValidator = [
    param("id", "El id no es válido").isMongoId(),
];
```

### Ataque que bloquea:
Esta regla bloquea directamente el **Ataque #9 (Id que no es un id)**.

### Explicación:
Cuando un cliente envía una petición como `GET /api/v1/usuarios/123abc`, la ruta ejecuta `idValidator` junto a [src/middlewares/validarCampos.js](src/middlewares/validarCampos.js#L3-L8). `isMongoId()` verifica que el parámetro cumpla la estructura hexadecimal exacta de 24 caracteres de BSON ObjectId. Si el ID es inválido, detiene el flujo inmediatamente y retorna un código `400 Bad Request`. Sin esta regla, el string inválido llegaría directo a `Usuario.findById("123abc")` en Mongoose, disparando una excepción interna de tipo `CastError` que respondería con un error `500 Internal Server Error` exponiendo detalles del servidor.

---

## 2. Redundancia entre express-validator y Schema de Mongoose: ¿Repetir o Defensa en Capas?

Un caso concreto en nuestra API es el campo `genero` en el registro de usuarios.

**En el validator** ([src/validators/usuario.validator.js](src/validators/usuario.validator.js#L6)):
```javascript
body("genero", "El género es obligatorio").notEmpty().isIn(["M", "F", "Otro"])
```

**En el esquema de Mongoose** ([models/usuarios.model.js](models/usuarios.model.js#L7)):
```javascript
genero: { type: String, enum: ["M", "F", "Otro"], default: "Otro" }
```

### ¿Es repetir por repetir o defensa en capas?
**Es defensa en capas con responsabilidades distintas.**

Hoy observamos que:
1. **`express-validator` actúa en la capa de transporte (HTTP):** Rechaza la solicitud con un código HTTP `400 Bad Request` legible antes de realizar consultas costosas a la base de datos o ejecutar lógica de negocio.
2. **El schema de Mongoose actúa en la capa de persistencia (Base de Datos):** Protege la base de datos contra inconsistencias en caso de que un registro sea creado internamente desde otro lugar del código (por ejemplo, scripts de inicialización, tareas en segundo plano o tests unitarios) sin pasar por las rutas HTTP.

---

## 3. Del Ataque 12: Referencia a la nada

### Lo que hizo la API:
Cuando un cliente intenta crear una lectura asociando un `usuario_id` o `prompt_usado_id` que no existe en MongoDB, la API rechaza la petición con un error `400 Bad Request`.

### Código de la implementación:
En [src/validators/lectura.validator.js](src/validators/lectura.validator.js#L5-L21):

```javascript
const usuarioExists = async (id) => {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
        return Promise.reject("El usuario_id no existe");
    }
};

const promptExists = async (id) => {
    const prompt = await PromptConfig.findById(id);
    if (!prompt) {
        return Promise.reject("El prompt_usado_id no existe");
    }
};

export const lecturaCreateValidator = [
    body("usuario_id", "El usuario_id es obligatorio").notEmpty().isMongoId().bail().custom(usuarioExists),
    body("prompt_usado_id", "El prompt_usado_id es obligatorio").notEmpty().isMongoId().bail().custom(promptExists),
    ...
];
```

### Decisión de diseño:
Decidimos resolver la existencia de claves foráneas mediante validadores asíncronos (`custom(...)`) con `.bail()` dentro del middleware de `express-validator`. De esta manera se evita intentar guardar documentos huérfanos que romperían la consistencia al poblar datos (`.populate()`).

---

## 4. Del Ataque 14: Actualización parcial con solo un campo

### Qué pasó realmente y por qué:
Al enviar un `PUT /api/v1/usuarios/:id` enviando únicamente `{ "nombre": "Nuevo Nombre" }`, la API respondió `200 OK` y al consultar el usuario con un `GET`, los otros 4 campos (`email`, `fechaNacimiento`, `genero`, `telefono`) se conservaron intactos.

### Explicación comprobada:
Mongoose utiliza internamente el operador `$set` de MongoDB cuando se le pasa un objeto a `findByIdAndUpdate`. Mongoose únicamente actualiza las llaves explícitamente presentes en el objeto `updateData`. Como los campos no enviados permanecen como `undefined`, no se incluyen en la sentencia `$set` y MongoDB mantiene los valores existentes en el documento.

---

## 5. Prevención de Mass Assignment y límite de `strict: true`

### Código donde se impide el Mass Assignment:
En [controllers/usuarios.controller.js](controllers/usuarios.controller.js#L5) y [controllers/usuarios.controller.js](controllers/usuarios.controller.js#L28):

```javascript
// Creación
const { nombre, email, fechaNacimiento, genero, telefono, password } = req.body;
const usuario = new Usuario({ nombre, email, fechaNacimiento, genero, telefono, password: hashedPassword });

// Actualización
const { nombre, email, fechaNacimiento, genero, telefono } = req.body;
const updateData = {};
if (nombre !== undefined) updateData.nombre = nombre;
if (email !== undefined) updateData.email = email;
if (fechaNacimiento !== undefined) updateData.fechaNacimiento = fechaNacimiento;
if (genero !== undefined) updateData.genero = genero;
if (telefono !== undefined) updateData.telefono = telefono;

const usuarioActualizado = await Usuario.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
```

### Por qué `strict: true` de Mongoose no basta por sí solo:
La propiedad `strict: true` de Mongoose únicamente ignora los campos que **NO existen** en el Schema. Sin embargo, si un modelo tiene campos definidos en el Schema que son sensibles o internos (por ejemplo `password`, `activo`, `rol`, `intentosFallidos`), un atacante podría modificarlos en un `PUT` o `POST` enviándolos en el JSON del cuerpo si se pasa `req.body` completo a `new Model(req.body)` o `findByIdAndUpdate(id, req.body)`. La desestructuración (whitelist) garantiza que sólo los atributos explícitamente permitidos por el desarrollador puedan ser asignados.

---

## 6. Falla que más costó entender

### Ataque #4 (Vacío disfrazado):
La falla que requirió mayor análisis fue el **Ataque #4**, donde al enviar `"   "` en un campo obligatorio, la petición era aceptada y guardada como un string vacío `""`.

### Qué me confundió al principio:
Inicialmente asumí que encadenar `.notEmpty().trim()` garantizaría que el texto no viniera vacío ni contuviera únicamente espacios. Sin embargo, no tomé en cuenta que `express-validator` ejecuta los eslabones en el orden en que son definidos:
1. Primero ejecutaba `.notEmpty()` sobre `"   "`. Como la longitud era 3, la condición se daba por válida.
2. Luego ejecutaba `.trim()`, lo cual transformaba `"   "` en `""` dentro de `req.body`.
3. Finalmente el controlador recibía un string vacío ya validado.

### Solución aprendida:
El orden correcto debe ser `.trim().notEmpty()`, para que primero se eliminen los espacios en blanco de los extremos y posteriormente `.notEmpty()` evalúe la cadena resultante limpia.
