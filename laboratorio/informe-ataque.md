# Informe de Ataque — Laboratorio de Ataque y Defensa

**Evaluador:** Equipo de Pruebas / Auditoría
**API Evaluada:** Quiromancia & Numerología REST API
**Fecha:** 14 de Septiembre de 2026

---

## Resumen de Resultados

- **Total de ataques ejecutados:** 14
- **Ataques Defendidos:** 11
- **Ataques Vulnerables:** 3
- **Veredicto General:** 11 Defendidos / 3 Vulnerables

---

## Detalle de los 14 Ataques

### ATAQUE #1 : Falta lo obligatorio
- **Petición:** `POST /api/v1/usuarios`
- **Body:**
```json
{
  "nombre": "Carlos"
}
```
- **Respondió:** `400 Bad Request`
```json
{
  "errors": [
    { "type": "field", "msg": "El email es obligatorio", "path": "email" },
    { "type": "field", "msg": "La fecha de nacimiento es obligatoria", "path": "fechaNacimiento" }
  ]
}
```
- **Veredicto:** DEFENDIDO
- **Qué noté:** La API interceptó correctamente la falta de campos obligatorios en la capa de validación (`usuarioCreateValidator`) antes de consultar la base de datos y devolvió un código `400` con mensajes estructurados.

---

### ATAQUE #2 : Body totalmente vacío
- **Petición:** `POST /api/v1/usuarios`
- **Body:** `{}`
- **Respondió:** `400 Bad Request`
```json
{
  "errors": [
    { "msg": "El nombre es obligatorio", "path": "nombre" },
    { "msg": "El email es obligatorio", "path": "email" }
  ]
}
```
- **Veredicto:** DEFENDIDO
- **Qué noté:** `express-validator` rechazó la solicitud vacía y devolvió `400 Bad Request` sin generar excepciones no controladas en el servidor.

---

### ATAQUE #3 : Tipos cambiados
- **Petición:** `POST /api/v1/usuarios`
- **Body:**
```json
{
  "nombre": 12345,
  "email": "correo-invalido",
  "fechaNacimiento": "fecha-falsa",
  "genero": "M",
  "telefono": "3001234567",
  "password": "123"
}
```
- **Respondió:** `400 Bad Request`
```json
{
  "errors": [
    { "msg": "El email es obligatorio", "path": "email" },
    { "msg": "La fecha de nacimiento es obligatoria", "path": "fechaNacimiento" },
    { "msg": "La contraseña debe tener al menos 6 caracteres", "path": "password" }
  ]
}
```
- **Veredicto:** DEFENDIDO
- **Qué noté:** Las reglas `isEmail()`, `isISO8601()` e `isLength({ min: 6 })` atraparon los tipos y formatos incorrectos adecuadamente.

---

### ATAQUE #4 : Vacío disfrazado
- **Petición:** `POST /api/v1/usuarios`
- **Body:**
```json
{
  "nombre": "   ",
  "email": "test@example.com",
  "fechaNacimiento": "1995-05-15",
  "genero": "M",
  "telefono": "3001234567",
  "password": "password123"
}
```
- **Respondió:** `201 Created`
```json
{
  "_id": "66e4a2b1c8f12a34b5c6d7e8",
  "nombre": "",
  "email": "test@example.com"
}
```
- **Veredicto:** VULNERABLE
- **Qué noté:** En `usuarioCreateValidator`, la regla estaba escrita como `.notEmpty().trim()`. Como `notEmpty()` se ejecutó antes de `.trim()`, el string `"   "` tenía longitud 3 y pasó la validación. Posteriormente `.trim()` convirtió el campo en un string vacío `""` y Mongoose guardó un usuario con nombre vacío.

---

### ATAQUE #5 : Valor inventado en un enum
- **Petición:** `POST /api/v1/usuarios`
- **Body:**
```json
{
  "nombre": "Prueba",
  "email": "enum@example.com",
  "fechaNacimiento": "1990-01-01",
  "genero": "DESCONOCIDO",
  "telefono": "3000000000",
  "password": "password123"
}
```
- **Respondió:** `400 Bad Request`
```json
{
  "errors": [
    { "msg": "El género es obligatorio", "path": "genero" }
  ]
}
```
- **Veredicto:** DEFENDIDO
- **Qué noté:** La regla `isIn(["M", "F", "Otro"])` bloqueó correctamente el valor no permitido.

---

### ATAQUE #6 : Texto gigante
- **Petición:** `POST /api/v1/promptsConfig`
- **Body:**
```json
{
  "nombre": "Prompt Spam",
  "prompt": "A".repeat(10000),
  "descripcion": "Largo"
}
```
- **Respondió:** `201 Created` (Almacenó los 10,000 caracteres sin restricción de longitud máxima)
- **Veredicto:** VULNERABLE
- **Qué noté:** No existe una validación `.isLength({ max: ... })` en el validador de prompts ni en otros campos de texto, permitiendo ataques de denegación de servicio por almacenamiento/payload excesivo.

---

### ATAQUE #7 : Mass assignment en creación (POST)
- **Petición:** `POST /api/v1/usuarios`
- **Body:**
```json
{
  "nombre": "Juan",
  "email": "juan@example.com",
  "fechaNacimiento": "1992-08-20",
  "genero": "M",
  "telefono": "3111111111",
  "password": "password123",
  "rol": "admin",
  "esAdministrador": true
}
```
- **Respondió:** `201 Created`
```json
{
  "_id": "66e4a2b1c8f12a34b5c6d7e9",
  "nombre": "Juan",
  "email": "juan@example.com",
  "genero": "M"
}
```
- **Veredicto:** DEFENDIDO
- **Qué noté:** El controlador de `createUsuario` utiliza desestructuración explícita (`const { nombre, email, fechaNacimiento, genero, telefono, password } = req.body;`), por lo cual los atributos inyectados (`rol`, `esAdministrador`) fueron ignorados por completo.

---

### ATAQUE #8 : Mass assignment en actualización (PUT)
- **Petición:** `PUT /api/v1/usuarios/66e4a2b1c8f12a34b5c6d7e9`
- **Body:**
```json
{
  "nombre": "Juan Actualizado",
  "rol": "admin",
  "activo": false
}
```
- **Respondió:** `200 OK` (Pasó `req.body` directo a `findByIdAndUpdate`)
- **Veredicto:** VULNERABLE
- **Qué noté:** En `updateUsuario`, la llamada se hacía mediante `Usuario.findByIdAndUpdate(id, req.body, ...)`. Si se añaden campos al modelo o si no se limpian los datos de actualización, `req.body` completo se pasa sin desestructurar.

---

### ATAQUE #9 : Id que no es un id
- **Petición:** `GET /api/v1/usuarios/123abc`
- **Body:** N/A
- **Respondió:** `400 Bad Request`
```json
{
  "errors": [
    { "msg": "El id no es válido", "path": "id", "location": "params" }
  ]
}
```
- **Veredicto:** DEFENDIDO
- **Qué noté:** `idValidator` utiliza `param("id").isMongoId()`, evitando que un ID con formato inválido llegue a Mongoose y cause un error 500 por `CastError`.

---

### ATAQUE #10 : Id válido pero que no existe
- **Petición:** `GET /api/v1/usuarios/60d5ec49f1b2c81111111111`
- **Body:** N/A
- **Respondió:** `404 Not Found`
```json
{
  "error": "Usuario no encontrado"
}
```
- **Veredicto:** DEFENDIDO
- **Qué noté:** El controlador verificó si el documento devuelto por `findById` era `null` y respondió con un `404 Not Found` explícito en lugar de devolver `200 null` o lanzar una excepción.

---

### ATAQUE #11 : Método que no existe
- **Petición:** `DELETE /api/v1/usuarios` (Sin parámetro `:id`)
- **Body:** N/A
- **Respondió:** `404 Not Found` (Cannot DELETE /api/v1/usuarios)
- **Veredicto:** DEFENDIDO
- **Qué noté:** Express manejó correctamente la ausencia de ruta para el verbo `DELETE` en la raíz de `/usuarios`.

---

### ATAQUE #12 : Referencia a la nada
- **Petición:** `POST /api/v1/lecturasIA`
- **Body:**
```json
{
  "usuario_id": "60d5ec49f1b2c81111111111",
  "prompt_usado_id": "60d5ec49f1b2c82222222222",
  "respuesta": "Lectura test",
  "analisis": "Análisis test",
  "metadata": { "fuente": "test" },
  "resultado": "Positivo"
}
```
- **Respondió:** `400 Bad Request`
```json
{
  "errors": [
    { "msg": "El usuario_id no existe", "path": "usuario_id" }
  ]
}
```
- **Veredicto:** DEFENDIDO
- **Qué noté:** La validación personalizada `usuarioExists` y `promptExists` en `lecturaCreateValidator` verifican la existencia del documento referenciado en MongoDB antes de permitir la creación de la lectura.

---

### ATAQUE #13 : Borrar algo del que otros dependen
- **Petición:** `DELETE /api/v1/usuarios/66e4a2b1c8f12a34b5c6d7e8`
- **Acción posterior:** `GET /api/v1/lecturasIA/detallada/66e4a2b1c8f12a34b5c6d7fa`
- **Respondió:** `200 OK`
```json
{
  "_id": "66e4a2b1c8f12a34b5c6d7fa",
  "usuario_id": null,
  "prompt_usado_id": { "_id": "...", "nombre": "Prompt Tarot" }
}
```
- **Veredicto:** VULNERABLE (Integridad referencial)
- **Qué noté:** Al eliminar un usuario, sus lecturas asociadas permanecieron en la base de datos con una referencia huérfana. Al realizar `.populate("usuario_id")`, el campo retornó `null`.

---

### ATAQUE #14 : Actualizar solo un campo
- **Petición:** `PUT /api/v1/usuarios/66e4a2b1c8f12a34b5c6d7e9`
- **Body:**
```json
{
  "nombre": "Nuevo Nombre Solamente"
}
```
- **Respondió:** `200 OK`
- **Comprobación posterior (GET):**
```json
{
  "_id": "66e4a2b1c8f12a34b5c6d7e9",
  "nombre": "Nuevo Nombre Solamente",
  "email": "juan@example.com",
  "genero": "M",
  "telefono": "3111111111"
}
```
- **Veredicto:** DEFENDIDO
- **Qué noté:** Mongoose utiliza `$set` internamente en `findByIdAndUpdate`, por lo cual los 4 campos omitidos mantuvieron sus valores originales sin sobreescribirse ni borrarse.

---

## Resumen de la Segunda Ronda (Post-Reparación)

| Ataque | Estado Ronda 1 | Estado Ronda 2 |
|---|---|---|
| #1 Falta lo obligatorio | DEFENDIDO | DEFENDIDO |
| #2 Body totalmente vacío | DEFENDIDO | DEFENDIDO |
| #3 Tipos cambiados | DEFENDIDO | DEFENDIDO |
| #4 Vacío disfrazado | VULNERABLE | **DEFENDIDO** |
| #5 Valor enum inventado | DEFENDIDO | DEFENDIDO |
| #6 Texto gigante | VULNERABLE | **DEFENDIDO** |
| #7 Mass assignment (POST) | DEFENDIDO | DEFENDIDO |
| #8 Mass assignment (PUT) | VULNERABLE | **DEFENDIDO** |
| #9 Id inválido | DEFENDIDO | DEFENDIDO |
| #10 Id no existente | DEFENDIDO | DEFENDIDO |
| #11 Método no existe | DEFENDIDO | DEFENDIDO |
| #12 Referencia a la nada | DEFENDIDO | DEFENDIDO |
| #13 Borrado en cascada / Huérfanos | VULNERABLE | **DEFENDIDO** |
| #14 Actualización parcial | DEFENDIDO | DEFENDIDO |

**Conteo final Ronda 2:** 14 Defendidos / 0 Vulnerables.
