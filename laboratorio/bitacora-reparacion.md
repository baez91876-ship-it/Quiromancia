# Bitácora de Reparación — Laboratorio de Ataque y Defensa

**Proyecto:** Quiromancia & Numerología REST API
**Fecha:** 14 de Septiembre de 2026

---

## 1. Clasificación Previas por Severidad (Antes de escribir código)

### Montón CRÍTICO
- **Ataque #13 (Borrar algo del que otros dependen):** Permitía eliminar un usuario dejando lecturas con `usuario_id` nulo, corrompiendo la integridad referencial y rompiendo consultas con `.populate()`.

### Montón GRAVE
- **Ataque #8 (Mass Assignment vía PUT):** Al pasar `req.body` directo a `Usuario.findByIdAndUpdate`, un atacante podía inyectar parámetros no autorizados si el esquema cambiaba o modificar atributos sensibles si estaban definidos en el modelo.

### Montón MENOR
- **Ataque #4 (Vacío disfrazado):** La regla `.notEmpty().trim()` evaluaba `.notEmpty()` primero sobre `"   "`, aprobándolo antes de recortar espacios.
- **Ataque #6 (Texto gigante):** Falta de restricción `.isLength({ max: ... })` en campos de texto como `prompt` y `descripcion`.

---

## 2. Plan y Orden de Reparación

1. **Paso 1 (CRÍTICO):** Reparar **Ataque #13** agregando validación de integridad referencial antes de eliminar un recurso dependiente en [controllers/usuarios.controller.js](controllers/usuarios.controller.js#L50).
2. **Paso 2 (GRAVE):** Reparar **Ataque #8** aplicando filtrado whitelist (desestructuración explícita) en [controllers/usuarios.controller.js](controllers/usuarios.controller.js#L28).
3. **Paso 3 (MENOR):** Reparar **Ataque #4** corrigiendo el orden del encadenamiento a `.trim().notEmpty()` en [src/validators/usuario.validator.js](src/validators/usuario.validator.js#L3-L10).
4. **Paso 4 (MENOR):** Reparar **Ataque #6** agregando límite máximo de caracteres con `.isLength({ max: 2000 })` en [src/validators/promptsConfig.validator.js](src/validators/promptsConfig.validator.js#L10-L18).

---

## 3. Detalle de las Reparaciones Ejecutadas

### REPARACIÓN del ATAQUE #13

- **Por qué falló:** En `deleteUsuario`, el controlador ejecutaba directamente `Usuario.findByIdAndDelete(id)` sin consultar si existían registros dependientes en la colección `LecturaIA`. Al borrar el usuario, sus lecturas quedaban huérfanas con `usuario_id` apuntando a un id inexistente.
- **Dónde lo arreglé:** `controller` en [controllers/usuarios.controller.js](controllers/usuarios.controller.js#L48-L58)
- **Qué cambié:**

*Código Antes:*
```javascript
export const deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioEliminado = await Usuario.findByIdAndDelete(id);

        if (!usuarioEliminado) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        return res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
```

*Código Después:*
```javascript
export const deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const lecturasAsociadas = await LecturaIA.countDocuments({ usuario_id: id });
        if (lecturasAsociadas > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar el usuario porque tiene lecturas registradas. Elimine primero sus lecturas.',
            });
        }

        const usuarioEliminado = await Usuario.findByIdAndDelete(id);

        if (!usuarioEliminado) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        return res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
```

- **Cómo lo comprobé:** Repetí el `DELETE /api/v1/usuarios/66e4a2b1c8f12a34b5c6d7e8` teniendo lecturas asociadas. La API respondió con `400 Bad Request` indicando que el usuario tiene lecturas registradas y previniendo la corrupción de datos.

---

### REPARACIÓN del ATAQUE #8

- **Por qué falló:** `updateUsuario` pasaba el objeto `req.body` completo a `Usuario.findByIdAndUpdate(id, req.body, ...)`.
- **Dónde lo arreglé:** `controller` en [controllers/usuarios.controller.js](controllers/usuarios.controller.js#L26-L38)
- **Qué cambié:**

*Código Antes:*
```javascript
export const updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioActualizado = await Usuario.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });
...
```

*Código Después:*
```javascript
export const updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, fechaNacimiento, genero, telefono } = req.body;
        const updateData = {};
        if (nombre !== undefined) updateData.nombre = nombre;
        if (email !== undefined) updateData.email = email;
        if (fechaNacimiento !== undefined) updateData.fechaNacimiento = fechaNacimiento;
        if (genero !== undefined) updateData.genero = genero;
        if (telefono !== undefined) updateData.telefono = telefono;

        const usuarioActualizado = await Usuario.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });
...
```

- **Cómo lo comprobé:** Repetí el ataque enviando campos adicionales (`rol: "admin"`). La actualización procesó únicamente los campos autorizados en `updateData`.

---

### REPARACIÓN del ATAQUE #4

- **Por qué falló:** `express-validator` evalúa los métodos en el orden en que se encadenan. Al poner `.notEmpty().trim()`, `notEmpty()` verificó la cadena con espacios `"   "` (longitud > 0) y aprobó la regla.
- **Dónde lo arreglé:** `validator` en [src/validators/usuario.validator.js](src/validators/usuario.validator.js#L3-L8)
- **Qué cambié:**

*Código Antes:*
```javascript
export const usuarioCreateValidator = [
    body("nombre", "El nombre es obligatorio").notEmpty().trim(),
    body("telefono", "El teléfono es obligatorio").notEmpty().trim(),
];
```

*Código Después:*
```javascript
export const usuarioCreateValidator = [
    body("nombre", "El nombre es obligatorio").trim().notEmpty(),
    body("telefono", "El teléfono es obligatorio").trim().notEmpty(),
];
```

- **Cómo lo comprobé:** Repetí la petición POST mandando `"   "`. `.trim()` recortó los espacios dejando `""`, y `.notEmpty()` inmediatamente rechazó la solicitud devolviendo `400 Bad Request`.

---

### REPARACIÓN del ATAQUE #6

- **Por qué falló:** No había una restricción de tamaño máximo en las cadenas enviadas al endpoint de configuración de prompts.
- **Dónde lo arreglé:** `validator` en [src/validators/promptsConfig.validator.js](src/validators/promptsConfig.validator.js#L11-L15)
- **Qué cambié:**

*Código Antes:*
```javascript
export const promptCreateValidator = [
    body("nombre", "El nombre es obligatorio").notEmpty().trim(),
    body("prompt", "El prompt es obligatorio").notEmpty().trim(),
    body("descripcion", "La descripción es obligatoria").notEmpty().trim(),
];
```

*Código Después:*
```javascript
export const promptCreateValidator = [
    body("nombre", "El nombre es obligatorio").trim().notEmpty().isLength({ max: 100 }),
    body("prompt", "El prompt es obligatorio y máximo 2000 caracteres").trim().notEmpty().isLength({ max: 2000 }),
    body("descripcion", "La descripción es obligatoria").trim().notEmpty().isLength({ max: 500 }),
];
```

- **Cómo lo comprobé:** Mandé un string de 10,000 caracteres en el campo `prompt`. La API respondió con `400 Bad Request` indicando que supera el límite de 2000 caracteres.
