# Informe de ataque y defensa

## Contexto y límites de la evidencia

- Fecha de actualización: 5 de octubre de 2026.
- Objetivo previo de ronda 1: URL anotada como `https://hxvknzzz-3000.use2.devtunnels.ms/api/v1`; esa dirección ya agotaba el tiempo de espera al intentar revalidarla.
- URL nueva proporcionada para esta ejecución: `https://hxvknzzz-0.use2.devtunnels.ms/`.
- Evidencia histórica: Postman (capturas identificadas abajo) y una prueba directa con `curl`.
- Autenticación/rol de las capturas: no registrados.
- El 5 de octubre probé el túnel nuevo con GET a `/`, `/health`, `/api/v1/usuarios`, `/api/v1/matricesNumerologicas`, `/api/v1/promptsConfig` y `/api/v1/lecturasIA`. Los seis dieron HTTP 404. No se recibió una respuesta de ninguna ruta de la API; el host/forward actual no conduce a una instancia reconocible del servicio.
- La API propia inició y conectó con MongoDB, pero la política del sandbox impidió conectarse a `localhost:3000` (“acceso a un socket no permitido”). Por ello, no hay resultados HTTP locales nuevos que atribuir a la aplicación.
- No se ejecutó ningún POST válido ni DELETE contra documentos reales. Una respuesta de error de conexión no cuenta como respuesta HTTP ni como ataque defendido.
- Los valores marcados **propuesta de petición** son un guion reproducible para la siguiente ronda, no evidencia de que se hayan enviado.

URLs que figuran en el registro:

```text
https://hxvknzzz-3000.use2.devtunnels.ms/api/v1
https://hxvknzzz-0.use2.devtunnels.ms/
```

**Resultado de la ejecución solicitada hoy:** no se lanzaron los 14 ataques contra el backend, porque el túnel nuevo devolvió 404 incluso para `/health` y las colecciones GET. Las respuestas no se atribuyen a validadores/controllers de la API. En particular, no se envió ningún POST o DELETE para evitar mutaciones si el host estuviera dirigido a otro servicio. Se requiere copiar de nuevo la dirección pública del puerto 3000 que tenga estado `Forwarded` y visibilidad `Public`.

## Ronda 1 — API del compañero

| # | Ataque | Petición y body enviado / por enviar | Respuesta observable | Veredicto |
|---|---|---|---|---|
| 1 | Falta lo obligatorio | Captura `084948`: `POST /usuarios`; el body no se lee en la captura. Propuesta para reproducir: body `{}`. | Captura: `400`; se ven errores para `nombre` y `email`. Falta conservar el JSON completo del body y respuesta. | **Pendiente de reproducción exacta.** Un 400 es indicio, no evidencia completa sin body legible. |
| 2 | Body totalmente vacío | Captura `093747`: `POST /promptsConfig`; editor aparentemente vacío, pero no se acredita `{}`. Propuesta: body literal `{}`. | Captura: `400`; errores visibles para `nombre` y `prompt`. | **Pendiente de reproducción exacta.** |
| 3 | Tipos cambiados | Propuesta: `POST /usuarios` con `{"nombre":42,"email":"lab@example.invalid","fechaNacimiento":"no-es-fecha","genero":"Otro","telefono":"5550000","password":"clave-laboratorio"}`. No consta envío. | Sin respuesta HTTP registrada. | **Pendiente.** |
| 4 | Vacío disfrazado | Propuesta: dos `POST /promptsConfig`, uno con `nombre:""` y otro con `nombre:"   "`; completar los demás campos requeridos con datos de prueba. No consta envío. | Sin respuesta HTTP registrada. | **Pendiente.** |
| 5 | Enum inventado | Propuesta: `POST /usuarios` con body válido salvo `genero:"X"`; no consta envío. | Sin respuesta HTTP registrada. | **Pendiente.** |
| 6 | Texto gigante | Propuesta: `POST /promptsConfig` con `prompt:"x".repeat(10000)` y los demás campos válidos; no consta envío. | Sin respuesta HTTP registrada. | **Pendiente.** |
| 7 | Mass assignment por POST | Propuesta: crear prompt sintético con `activo:false`, luego hacer GET del documento creado; no constan request, ID nuevo ni GET. | Sin respuesta HTTP registrada. | **Pendiente.** |
| 8 | Mass assignment por PUT | Propuesta: cambiar `activo` en un prompt desechable con PUT y leerlo con GET; no constan ID ni peticiones. | Sin respuesta HTTP registrada. | **Pendiente.** |
| 9 | ID malformado | Enviado: `GET /matricesNumerologicas/123abc`, sin body. | Primer intento: timeout a los 20 s. Reintento: `404`, body vacío. | **Inconcluso.** No se verificó que el 404 proviniera del handler ni se obtuvo mensaje JSON. |
| 10 | ObjectId válido inexistente | Enviado: `GET /matricesNumerologicas/85d17107e26c436ba29bb717`, sin body. | `404`, body vacío. | **Inconcluso.** Es el status esperado para no encontrado, pero el body vacío no acredita la respuesta clara de la aplicación. |
| 11 | Método no definido | No consta un DELETE enviado a una ruta confirmada como solo GET. Las capturas dejan `:id` literal. Propuesta segura: usar la URL de una ruta documentada solo-GET, sin ID ni recurso real, y registrar el status. | Sin respuesta reproducible para este caso. | **Pendiente.** |
| 12 | Referencia a la nada | No consta POST con ObjectId inexistente ni GET posterior con `populate`. | Sin respuesta HTTP registrada. | **Pendiente.** |
| 13 | Borrar documento referenciado | No consta DELETE de un fixture ni GET posterior del documento relacionado. | Sin respuesta HTTP registrada. | **Pendiente; destructivo.** No se recibió ID confirmado como descartable y no se borra información ajena. |
| 14 | PUT de un solo campo | Capturas `091536` y `093156`: `PUT /matricesNumerologicas/:id`, marcador literal en lugar de ID real. | `400 El id no es válido`. | **Pendiente.** No hubo actualización parcial válida ni GET antes/después. |

### Otras capturas disponibles

- `090725`: `POST /usuarios/login` sin datos legibles dio `400`; aparecen errores de email y password.
- `090931`: `GET /usuarios` dio `200` con registros. No constan autenticación ni rol.
- `092340`: `POST /matricesNumerologicas` con editor vacío dio `400`; se ve `usuario_id` obligatorio.
- `092725`: `GET /matricesNumerologicas` dio `200` con registros.
- `091051`, `091302`, `092829`, `092953`: URL con `:id` literal, respuesta `400 El id no es válido`; no sustituyen #9 ni #10.
- `091655` y `093557`: DELETE con `:id` literal dio `400` y `404` respectivamente; no es prueba controlada ni segura de borrado por relación.

**Conteo de ronda 1:** `0 defendidos / 0 vulnerables / 10 pendientes / 2 inconclusos / 2 con evidencia parcial (#1 y #2)`.

El conteo no convierte los indicios incompletos en defensas. Para cada caso pendiente, anotar la URL completa vigente, método, JSON literal, status, respuesta completa y momento de ejecución.

## Ronda 2 — verificación posterior a las reparaciones

La ronda 2 exige el HTTP de la API del compañero después de sus reparaciones. El túnel histórico no respondió durante la verificación y no se proporcionó otra URL. La API propia tampoco permitió HTTP local desde el sandbox. Por tanto, los siguientes son **bloqueos**, no respuestas simuladas:

| # | Prueba requerida | Resultado ronda 2 | Cierre / regresión |
|---|---|---|---|
| 1 | POST con campos obligatorios ausentes | Sin respuesta: sin acceso HTTP | No determinable |
| 2 | POST con `{}` | Sin respuesta: sin acceso HTTP | No determinable |
| 3 | Tipos incorrectos | Sin respuesta: sin acceso HTTP | No determinable |
| 4 | `""` y `"   "` en requerido | Sin respuesta: sin acceso HTTP | No determinable |
| 5 | Enum inválido | Sin respuesta: sin acceso HTTP | No determinable |
| 6 | String de 10.000 caracteres | Sin respuesta: sin acceso HTTP | No determinable |
| 7 | POST con campo protegido y GET | Sin respuesta: sin acceso HTTP | No determinable |
| 8 | PUT con campo protegido y GET | Sin respuesta: sin acceso HTTP | No determinable |
| 9 | ID con formato inválido | Sin respuesta: sin acceso HTTP | No determinable |
| 10 | ID válido inexistente | Sin respuesta: sin acceso HTTP | No determinable |
| 11 | Método no permitido | Sin respuesta: sin acceso HTTP | No determinable |
| 12 | Referencia no existente y populate | Sin respuesta: sin acceso HTTP | No determinable |
| 13 | Borrado de fixture referenciado y populate | Sin respuesta; falta ID desechable | No determinable |
| 14 | PUT parcial y GET antes/después | Sin respuesta; falta fixture conocido | No determinable |

**Conteo ronda 2:** `0 defendidos / 0 vulnerables / 14 bloqueados por falta de canal HTTP o fixture seguro`. No equivale a que hayan fallado los controles.

**CRUD normal completo/regresiones:** no ejecutado por el mismo bloqueo HTTP. Las pruebas automatizadas unitarias no equivalen a CRUD persistente.

## Comprobaciones locales de código

En esta ejecución, `npm.cmd test` terminó con código 0, pero `test/validators.test.js` tiene 0 bytes; el único resultado del runner fue cargar el archivo, sin aserciones. Por tanto, no lo cuento como una suite que valide los controles.

El servidor inició y conectó a MongoDB, pero no fue posible enviarle peticiones HTTP desde este entorno. La dirección de túnel compartida devolvió 404 en `/health` y en las rutas probadas. No se hicieron escrituras ni borrados en la base real.

## Ejecución local sobre el código (sin transporte HTTP)

Por la aclaración de que la prueba debía hacerse “sobre el código”, ejecuté las cadenas de `express-validator` junto con `validarCampos`, invoqué controllers aislados con métodos de Mongoose simulados, inspeccioné los métodos registrados en el router y probé el casteo de una query Mongoose sin ejecutarla. Los resultados siguientes demuestran el flujo de código, **no** son respuestas HTTP observadas ni lecturas/escrituras persistentes. Para #12 se simuló que la búsqueda del documento referenciado no encontraba nada; para #7, #8, #10 y #13 se simularon las operaciones Mongoose.

### Ronda 1 — resultados de código

**ATAQUE #1: Falta lo obligatorio**

- Petición: `POST /api/v1/usuarios`
- Body: `{"nombre":"Lab"}`
- Resultado del middleware ejecutado: `400`, `errors` para `password`, `email`, `fechaNacimiento` (dos reglas), `genero` (dos reglas) y `telefono`.
- Veredicto: **DEFENDIDO (código)**.
- Qué noté: `validarCampos` corta antes del controller; faltan peticiones HTTP reales para validar la serialización final.

**ATAQUE #2: Body totalmente vacío**

- Petición: `POST /api/v1/promptsConfig`
- Body: `{}`
- Resultado del middleware ejecutado: `400`, errores para `nombre`, `prompt`, `descripcion`, `categoria`, `tipo_lectura` y `creadoPor`.
- Veredicto: **DEFENDIDO (código)**.
- Qué noté: los campos requeridos bloquean el acceso al controller.

**ATAQUE #3: Tipos cambiados**

- Peticiones/casos: `POST /api/v1/usuarios` con `nombre: 42`; la misma ruta con `fechaNacimiento: "ayer"`; `PUT /api/v1/promptsConfig/:id` con `activo: "no-es-booleano"`.
- Bodies de prueba: `{"nombre":42,"email":"lab@example.invalid","fechaNacimiento":"2000-01-01","genero":"Otro","telefono":"5550000","password":"lab-pass"}`; `{"nombre":"Lab","email":"lab@example.invalid","fechaNacimiento":"ayer","genero":"Otro","telefono":"5550000","password":"lab-pass"}`; `{"activo":"no-es-booleano"}`.
- Resultado del código: el validator acepta el nombre numérico y Mongoose lo castea a `"42"`; rechaza la fecha inválida con `400`; el validator de PUT no revisa `activo`, mientras que el schema no puede castear esa cadena como booleano. El controller de prompts responde con `500` y `error.message` si la operación Mongoose falla.
- Veredicto: **VULNERABLE (parcial)**.
- Qué noté: falta exigir tipo string en texto; la fecha sí tiene regla. `activo` no tiene regla de entrada y un valor inválido puede convertirse en error interno expuesto.

**ATAQUE #4: Vacío disfrazado**

- Petición: `POST /api/v1/promptsConfig`, probando `nombre: ""` y `nombre: "   "`.
- Bodies: `{"nombre":""}` y `{"nombre":"   "}` (se ejecutó la regla de `nombre`).
- Resultado del middleware ejecutado: ambos casos dan `400` y `"El nombre es obligatorio"`; `.trim()` ocurre antes de `.notEmpty()`.
- Veredicto: **DEFENDIDO (código)**.
- Qué noté: se bloquean tanto la cadena vacía como los espacios.

**ATAQUE #5: Valor inventado en un enum**

- Petición: `POST /api/v1/usuarios`
- Body: `{"genero":"X"}`
- Resultado del middleware ejecutado: `400`, error en `genero`.
- Veredicto: **DEFENDIDO (código)**.
- Qué noté: el status es correcto, aunque el texto devuelto usa el mensaje genérico `"El género es obligatorio"` también para un enum inválido.

**ATAQUE #6: Texto gigante**

- Petición: `POST /api/v1/promptsConfig`
- Body: campo `prompt` con 10.000 caracteres `x`.
- Resultado de la regla ejecutada: `400`, error en `prompt` por el máximo de 2.000 caracteres.
- Veredicto: **DEFENDIDO (código)**.
- Qué noté: la respuesta de validación incluye el valor enviado; con 10.000 caracteres, el cuerpo del error también puede ser grande. Se ejecutó la regla aislada, no la petición HTTP completa.

**ATAQUE #7: Mass assignment por POST**

- Petición: `POST /api/v1/promptsConfig`
- Body: `{"nombre":"Lab","prompt":"p","descripcion":"d","categoria":"c","tipo_lectura":"t","creadoPor":"000000000000000000000001","activo":false}`
- Resultado: se ejecutaron los validators y el controller con la búsqueda del usuario y `save()` simulados; status `201`; `activo` resultó `true` por el default del schema.
- Veredicto: **DEFENDIDO (código)**.
- Qué noté: el controller solo copia campos permitidos al modelo y omite `activo`.

**ATAQUE #8: Mass assignment por PUT**

- Petición: `PUT /api/v1/promptsConfig/000000000000000000000001`
- Body: `{"activo":false}`
- Resultado: se ejecutaron el validador de ID, el validator de actualización y el controller con `findByIdAndUpdate()` simulado; status `200`; `activo:false` se incluyó en el resultado.
- Veredicto: **VULNERABLE (código)**.
- Qué noté: el validator no declara `activo`, pero el controller sí lo extrae del body y lo envía a Mongoose. La simulación no escribió en MongoDB.

**ATAQUE #9: Id malformado**

- Petición: `GET /api/v1/matricesNumerologicas/123abc`
- Body: ninguno.
- Resultado del middleware ejecutado: `400 {"errors":[{"msg":"El id no es válido","path":"id","location":"params"}]}`.
- Veredicto: **DEFENDIDO (código)**.
- Qué noté: `idValidator` bloquea antes de que `findById` pueda producir un `CastError`.

**ATAQUE #10: ObjectId válido pero inexistente**

- Petición: `GET /api/v1/promptsConfig/000000000000000000000002`
- Body: ninguno.
- Resultado del controller con `findById()` simulado como `null`: `404 {"error":"PromptConfig no encontrado"}`.
- Veredicto: **DEFENDIDO (código)**.
- Qué noté: el controller diferencia el documento ausente. No se consultó MongoDB real.

**ATAQUE #11: Método no definido**

- Petición: `DELETE /api/v1/matricesNumerologicas/completa/000000000000000000000001`
- Body: ninguno.
- Resultado de inspección: `/completa/:id` está registrado solo para `GET`; no existe handler `DELETE` ni fallback JSON 404 en `app.js`. Express devolvería su 404 predeterminado (HTML), inferido del router, no capturado por HTTP.
- Veredicto: **DEFENDIDO en status/ruta; MENOR en formato de respuesta**.
- Qué noté: no ejecuta un borrado, pero el cliente no recibe el JSON uniforme de la API.

**ATAQUE #12: Referencia a la nada**

- Petición: `POST /api/v1/matricesNumerologicas`
- Body: `{"usuario_id":"<ObjectId válido inexistente>","numeroVida":1,"numeroDestino":1,"descripcion":"lab","resultado":"lab"}`
- Resultado del validador con `Usuario.findById()` simulado como `null`: `400`, `"El usuario_id no existe"`.
- Veredicto: **DEFENDIDO (código)**.
- Qué noté: la comprobación de existencia evita llegar al controller en este flujo. No se comprobó `populate` de un documento persistido.

**ATAQUE #13: Borrar un documento referenciado**

- Petición: `DELETE /api/v1/promptsConfig/<id de prompt usado por una lectura>`
- Body: ninguno.
- Resultado del controller con `findByIdAndDelete()` simulado: status `200`; se invocó el borrado sin buscar lecturas dependientes.
- Veredicto: **VULNERABLE (código)**.
- Qué noté: `deletePromptConfig` no protege la relación con `LecturaIA`. Un `populate("prompt_usado_id")` posterior previsiblemente devolvería `null`; no se borró ni consultó un documento real.

**ATAQUE #14: PUT de un solo campo**

- Petición: `PUT /api/v1/matricesNumerologicas/000000000000000000000001`
- Body: `{"descripcion":"solo-descripcion"}`
- Resultado de casteo Mongoose, sin ejecutar la query: `{ "$set": { "descripcion": "solo-descripcion" } }`; las propiedades `undefined` se omitieron.
- Veredicto: **DEFENDIDO contra pérdida de los demás campos (semántica de Mongoose)**.
- Qué noté: el update generado solo cambia `descripcion`. No se hizo GET antes/después de un documento persistido.

**Conteo de esta ronda de código:** `11 defendidos / 3 vulnerables` (#3 parcial, #8 y #13), con una observación menor de formato en #11. Este conteo clasifica lo que se ejecutó/inspeccionó en código; **no sustituye** el conteo requerido de ataques HTTP reproducidos.

## Resultado final — enumeración

**Defendidos sobre el código (11):**
1. **#1 — Falta lo obligatorio**
2. **#2 — Body totalmente vacío**
3. **#4 — Vacío disfrazado**
4. **#5 — Valor inventado en un enum**
5. **#6 — Texto gigante**
6. **#7 — Mass assignment por POST**
7. **#9 — Id malformado**
8. **#10 — ObjectId válido pero inexistente**
9. **#11 — Método no definido** (status/ruta; el formato 404 es una observación menor)
10. **#12 — Referencia a la nada**
11. **#14 — PUT de un solo campo**

**Vulnerables o parcialmente vulnerables sobre el código (3):**
1. **#3 — Tipos cambiados** (parcial: no se exige texto en algunos campos y un tipo inválido para `activo` puede acabar en 500)
2. **#8 — Mass assignment por PUT** (`activo` se acepta y se envía a Mongoose)
3. **#13 — Borrar un documento referenciado** (no se impide borrar un prompt usado por lecturas)

**Conteo:** `11 defendidos / 3 vulnerables o parcialmente vulnerables`. Son resultados de ejecución/inspección local del código; **no** son 14 ataques HTTP reproducidos. Las peticiones HTTP realmente ejecutadas contra la API en esta ronda fueron `0 de 14`.
