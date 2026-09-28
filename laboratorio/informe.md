# Informe de ataques a la API

## Datos de la prueba

- Atacante: completar.
- API del compañero: completar.
- URL base del túnel: completar; no usar `localhost` desde otra computadora.
- Fecha y ronda: completar.
- Datos preparados: mínimo tres documentos por colección y dos relaciones `ref` válidas.
- Recursos observados en este proyecto: `/api/v1/usuarios`, `/api/v1/promptsConfig`, `/api/v1/matricesNumerologicas`, `/api/v1/lecturasIA` y `/api/v1/bitacoraTransacciones`.
- Acceso: anotar los headers requeridos por el compañero. En este proyecto, `POST /api/v1/lecturasIA` usa `x-api-key`.

> Esta es una plantilla de evidencia. No se recibieron la URL ni respuestas HTTP de la API del compañero; por eso no asigno veredictos ni conteos inventados. Completa cada respuesta con lo que devolvió Postman, incluyendo el JSON completo.

## Ronda 1

Para cada fila registra método, URL completa, body enviado, código HTTP y respuesta, veredicto y diferencia entre lo esperado y lo observado. Sustituye los identificadores de ejemplo por IDs del entorno bajo prueba.

| # | Ataque, petición y body | Respondió / veredicto / qué noté |
| --- | --- | --- |
| 1 | Falta lo obligatorio. `POST /api/v1/promptsConfig`; enviar solo `{"nombre":"Prueba"}`. | Pendiente de ejecutar. |
| 2 | Body vacío. `POST /api/v1/promptsConfig`; enviar `{}`. | Pendiente de ejecutar. |
| 3 | Tipos cambiados. `POST /api/v1/usuarios`; enviar los demás campos válidos, pero `nombre: 123` y `fechaNacimiento: "ayer"`. | Pendiente de ejecutar. |
| 4 | Vacío disfrazado. `POST /api/v1/promptsConfig`; enviar los campos válidos y probar `nombre: ""`, luego `nombre: "   "`. | Pendiente de ejecutar. |
| 5 | Enum inventado. `POST /api/v1/usuarios`; enviar los demás campos válidos y `genero: "X"`. | Pendiente de ejecutar. |
| 6 | Texto gigante. `POST /api/v1/promptsConfig`; enviar un `prompt` de exactamente 10.000 caracteres y los demás campos válidos. | Pendiente de ejecutar. |
| 7 | Mass assignment en creación. `POST /api/v1/promptsConfig`; enviar `creadoPor` con el ID válido de otro usuario. Comprobar por GET si se guardó. | Pendiente de ejecutar. |
| 8 | Mass assignment en actualización. `PUT /api/v1/promptsConfig/<ID_PROMPT>`; enviar `{"creadoPor":"<ID_OTRO_USUARIO>"}` y comprobar por GET. | Pendiente de ejecutar. |
| 9 | ID con formato inválido. `GET /api/v1/matricesNumerologicas/123abc`. | Pendiente de ejecutar. |
| 10 | ID válido inexistente. `GET /api/v1/matricesNumerologicas/<OBJECTID_VALIDO_NO_EXISTENTE>`. | Pendiente de ejecutar. |
| 11 | Método no definido. `PATCH /api/v1/promptsConfig`. | Pendiente de ejecutar. |
| 12 | Referencia inexistente. `POST /api/v1/bitacoraTransacciones`; usar `usuario_id` válido y `lectura_id` con formato ObjectId correcto pero sin documento correspondiente; completar también `tipo`, `monto`, `estado` y `detalles`. | Pendiente de ejecutar. |
| 13 | Borrar documento referenciado. Eliminar con `DELETE /api/v1/promptsConfig/<ID_PROMPT>` un prompt usado por una lectura; luego consultar `GET /api/v1/lecturasIA/detallada/<ID_LECTURA>`. | Pendiente de ejecutar. |
| 14 | Actualización parcial. `PUT /api/v1/promptsConfig/<ID_PROMPT>` con `{"nombre":"Nombre actualizado"}`; después consultar el mismo documento y comparar los demás campos. | Pendiente de ejecutar. |

**Conteo de la ronda 1:** `__ defendidos / __ vulnerables / __ pendientes`.

## Ronda 2

Después de que el dueño de la API repare sus hallazgos, repite los ataques 1–14 contra la misma URL y con los mismos datos. Guarda las nuevas respuestas y compara cada una con la ronda 1. Ejecuta además un CRUD normal para buscar regresiones.

| # | Código HTTP y respuesta de ronda 2 | Veredicto | ¿Hallazgo original cerrado? ¿Regresión o fallo nuevo? |
| --- | --- | --- | --- |
| 1 | Pendiente de ejecutar. | Pendiente | Pendiente |
| 2 | Pendiente de ejecutar. | Pendiente | Pendiente |
| 3 | Pendiente de ejecutar. | Pendiente | Pendiente |
| 4 | Pendiente de ejecutar. | Pendiente | Pendiente |
| 5 | Pendiente de ejecutar. | Pendiente | Pendiente |
| 6 | Pendiente de ejecutar. | Pendiente | Pendiente |
| 7 | Pendiente de ejecutar. | Pendiente | Pendiente |
| 8 | Pendiente de ejecutar. | Pendiente | Pendiente |
| 9 | Pendiente de ejecutar. | Pendiente | Pendiente |
| 10 | Pendiente de ejecutar. | Pendiente | Pendiente |
| 11 | Pendiente de ejecutar. | Pendiente | Pendiente |
| 12 | Pendiente de ejecutar. | Pendiente | Pendiente |
| 13 | Pendiente de ejecutar. | Pendiente | Pendiente |
| 14 | Pendiente de ejecutar. | Pendiente | Pendiente |

**Conteo de la ronda 2:** `__ defendidos / __ vulnerables / __ pendientes`.

## Evidencia por petición

Duplica este bloque para cada ataque de ambas rondas:

```text
ATAQUE #__ : nombre
Petición:    MÉTODO URL_COMPLETA
Headers:     headers realmente enviados (oculta secretos al compartir el informe)
Body:        JSON exacto enviado
Respondió:   código HTTP + respuesta completa
Veredicto:   DEFENDIDO / VULNERABLE / PENDIENTE
Qué noté:    esperado frente a observado
```