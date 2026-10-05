# Bitácora de reparación

## Orden de prioridad y limitación cronológica

Esta bitácora se redactó después de que ya hubiera cambios en el código. Por tanto, **no puedo afirmar que la priorización quedara escrita antes de modificarlo**, como requiere el ejercicio. La siguiente prioridad es una reconstrucción del riesgo a partir del código previo, no un resultado de ataque remoto.

### CRÍTICO — integridad/mass assignment

1. **Ataques #7–8:** el controller de actualización de prompts leía `activo` del body. `activo` sí está declarado en el schema, por lo que Mongoose `strict` no lo eliminaría.
2. **Ataques #12–13:** las relaciones Mongo `ref` no aseguran integridad referencial. Los validators ya verificaban varias relaciones; los borrados de usuario/prompt/lectura no bloqueaban todos los dependientes.
3. **Ataques #1, #2, #4:** validators con `.notEmpty()` antes de `.trim()` podían aceptar espacios y dejar que valores vacíos llegaran a esquemas con campos opcionales.

### GRAVE — error interno al cliente

4. Varios `catch` devolvían `error.message` de Mongoose y forzaban status 500 incluso ante fallos de validación.

### MENOR — contrato, códigos y claridad

5. Los bodies no siempre rechazaban propiedades no definidas en el contrato. Algunos campos de texto no verificaban el tipo de entrada explícitamente.
6. Las actualizaciones enviaban objetos con propiedades `undefined`, dependiendo del tratamiento de Mongoose para la semántica de PUT parcial.
7. Faltaba fallback JSON consistente para rutas inexistentes.
8. En #10 había que comprobar la respuesta 404 del controller con un ID sintácticamente válido pero inexistente.

**Orden de implementación reconstruido:** (1) reducir campos aceptados y validar entrada, (2) proteger referencias y borrados, (3) normalizar respuestas de error, (4) explicitar actualizaciones parciales y 404, (5) verificar con pruebas. No presenta una cronología anterior al cambio.

## Reparaciones y comprobación disponible

### #1–6: reglas de entrada

- **Causa:** faltaba recortar antes de probar no vacío y algunas reglas no fijaban tipo string.
- **Capa:** validators de usuario, matriz, prompt, lectura y bitácora.
- **Cambio:** `.trim()` antes de `.notEmpty()`; `isString()` en campos textuales/fecha; se conservan las comprobaciones de enum, ISO-8601, números y longitudes. Se añadió `checkExact` a user/matriz/lectura/bitácora para rechazar body fields no validados.
- **Comprobación:** tests locales de espacios, prompt de 10.000 caracteres y propiedad de body no admitida; incluidos en `npm.cmd test`, 9/9 aprobados. Sin petición HTTP por bloqueo de sockets del sandbox.

### #7–8: `activo` y mass assignment

- **Causa:** el PUT destructuraba y mandaba `activo` a Mongoose aunque no existiera una regla para que el cliente lo pudiera editar; el POST también debía mantener una lista de campos explícita.
- **Capa:** controllers de prompts.
- **Cambio:** el POST construye el modelo con campos permitidos; el PUT forma `updateData` únicamente con nombre, prompt, descripción, categoría, tipo de lectura y creador.
- **Comprobación:** tests locales invocan los controllers con `activo:false`; POST conserva el default del modelo (`true`) y PUT no entrega esa propiedad a `findByIdAndUpdate`. No se hizo GET HTTP posterior ni se modificó una base real.

### #9–10: ObjectIds

- **Causa:** un ObjectId mal formado puede producir CastError; un ObjectId bien formado puede no tener documento.
- **Capa:** `idValidator` para sintaxis; controller para existencia.
- **Cambio:** se conserva la regla `isMongoId()` y la respuesta de `validarCampos` es 400; los controllers contestan 404 cuando la búsqueda devuelve null.
- **Comprobación:** test local valida `123abc`. No hubo HTTP para comprobar el status/body end-to-end ni GET al ID aleatorio.

### #11: método/ruta no registrada

- **Causa:** no existía handler JSON catch-all.
- **Capa:** middleware de aplicación en `app.js`.
- **Cambio:** se añadió respuesta 404 `{ error: "Ruta no encontrada" }` antes del middleware de error.
- **Comprobación:** revisión/importación de rutas; HTTP no ejecutable en este entorno.

### #12: referencia inexistente

- **Causa:** `ref` en schema solo describe populate y no demuestra que exista el documento destino.
- **Capa:** validators en la entrada HTTP.
- **Cambio:** los validadores encadenan `isMongoId().bail().custom(exists)` para las relaciones de matrices, prompts, lecturas y bitácora. El rechazo sucede antes del controller cuando la consulta confirma ausencia.
- **Comprobación:** se revisó la cadena del validator; faltó ejecutar la consulta en HTTP contra una base de prueba. No se afirma que la referencia huérfana se haya reproducido en sesión.

### #13: borrar un documento usado por otros

- **Causa:** `findByIdAndDelete` podía dejar documentos dependientes.
- **Capa:** controllers de usuario, prompt y lectura.
- **Cambio:** consultas `exists()` preceden al borrado. Cuando hay dependientes se responde 409 y no se ejecuta el delete. No se hace cascada automática.
- **Comprobación:** test unitario simula una lectura dependiente de prompt y confirma status 409 y que no se invoca el delete. No se ejecutó borrado real.

### #14: actualización parcial

- **Causa:** los objetos de PUT incluían claves omitidas con `undefined`, dejando implícita la semántica de update.
- **Capa:** controllers de matriz, prompt, lectura y bitácora; usuario ya construía una allowlist por presencia.
- **Cambio:** `updateData` contiene solo valores recibidos y campos permitidos.
- **Comprobación:** test unitario manda solo `descripcion` a la ruta de matrices y confirma que es el único campo pasado a Mongoose. El documento persistido antes/después no pudo consultarse por HTTP.

### Manejo de errores

- **Causa:** los controllers filtraban `error.message` crudo al cliente y uniformaban fallos de validación como 500.
- **Capa:** helper común en `middlewares/errores.js`, llamado desde los controllers.
- **Cambio:** `ValidationError` y `CastError` -> 400 genérico; duplicado 11000 -> 409; error inesperado -> log en servidor y 500 genérico. JSON malformado conserva 400.
- **Comprobación:** test local confirma que una excepción con texto interno devuelve solo `{ error: "Error interno del servidor" }`. No se provocó una excepción HTTP real.

