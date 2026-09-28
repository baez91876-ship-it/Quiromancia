# Defensa técnica

## Estado de las respuestas

Las preguntas que requieren ejecutar ataques están marcadas como pendientes. El código citado describe la implementación local, pero no sustituye la evidencia HTTP ni los resultados contra la API del compañero. Completa los fragmentos y las observaciones con tu propia ejecución antes de entregar.

## 1. Regla de validator y ataque que bloquea

En `src/validators/promptsConfig.validator.js` existe esta regla:

```js
body("prompt", "El prompt es obligatorio y máximo 2000 caracteres")
    .trim()
    .notEmpty()
    .isLength({ max: 2000 }),
```

Por código, comprueba los ataques 1, 2 y 4 cuando falta el prompt o llega vacío/después de quitar espacios, y el ataque 6 cuando excede 2000 caracteres. Registra el ataque concreto que ejecutaste y su respuesta HTTP en [informe.md](informe.md); la evidencia todavía está pendiente.

## 2. Validator y schema rechazan el mismo dato

El validator comprueba `nombre` antes de entrar al controller:

```js
body("nombre", "El nombre es obligatorio").trim().notEmpty(),
```

Archivo: `src/validators/usuario.validator.js`.

El schema también lo marca como requerido:

```js
nombre: { type: String, required: true, trim: true },
```

Archivo: `models/usuarios.model.js`.

En el flujo HTTP normal, el validator puede devolver un `400` con un mensaje de campo claro. La validación del schema es una segunda barrera para escrituras Mongoose que no pasen por esa ruta. Para completar la respuesta, compara la salida observada del ataque 1 o 2 con el error que produciría una escritura inválida directa.

## 3. Ataque 12: referencia a un documento inexistente

La validación de bitácora comprueba que la lectura exista:

```js
const lecturaExists = async (id) => {
    const lectura = await LecturaIA.findById(id);
    if (!lectura) {
        return Promise.reject("El lectura_id no existe");
    }
};
```

Archivo: `src/validators/bitacora.validator.js`. Por código, se espera que `validarCampos` detenga la petición inválida con `400`; eso no confirma lo que devolvió la API al ejecutar el ataque. **Resultado observado:** pendiente. **Decisión sobre la relación y su justificación:** completar tras probar el ataque 12 y el `populate` correspondiente.

## 4. Ataque 14: actualización de un solo campo

El controller de prompts pasa al update los campos extraídos del body:

```js
const promptConfig = await PromptConfig.findByIdAndUpdate(
    id,
    { nombre, prompt, descripcion, activo, categoria, tipo_lectura, creadoPor },
    { new: true, runValidators: true }
);
```

Archivo: `controllers/promptsConfig.controller.js`. El validator permite omitir campos en una actualización. Mongoose normalmente omite valores `undefined` en este tipo de update, pero la respuesta de esta pregunta debe basarse en comparar el documento antes y después de la petición real. **Resultado del ataque:** pendiente de ejecutar y verificar con GET.

## 5. Mass assignment y `strict: true`

El campo `creadoPor` pertenece al schema y el controller lo toma del body:

```js
const { nombre, prompt, descripcion, categoria, tipo_lectura, creadoPor } = req.body;
const promptConfig = new PromptConfig({ nombre, prompt, descripcion, categoria, tipo_lectura, creadoPor });
```

Archivo: `controllers/promptsConfig.controller.js`. El validator verifica que el ID tenga formato Mongo y que el usuario exista (`src/validators/promptsConfig.validator.js`), pero no comprueba que sea el usuario que envía la petición. `strict: true` no elimina `creadoPor`, porque sí es un campo declarado en el schema (`models/promptsConfig.model.js`). Usa el resultado de los ataques 7 y 8 para determinar si el compañero logró cambiarlo y documenta la evidencia; no afirmes el resultado sin ejecutar.

## 6. Falla más difícil de entender

Respuesta personal; completar después de las dos rondas:

- Falla: pendiente.
- Qué pensé inicialmente: pendiente.
- Qué comprobación mostró la causa real: pendiente.
- Qué aprendí: pendiente.