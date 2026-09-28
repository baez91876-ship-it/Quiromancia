# Bitácora de reparación

## Estado

No se modificó el código para este ejercicio. La bitácora se completa después de recibir el informe de ataques y antes de cambiar una línea, como pide el laboratorio. Las categorías siguientes son criterios de clasificación, no resultados de ataques todavía no ejecutados.

## Priorización previa a reparar

Tras completar la ronda 1, traslada aquí cada hallazgo reproducible y clasifícalo antes de editar:

| Severidad | Criterio | Ataques confirmados y evidencia |
| --- | --- | --- |
| CRÍTICO | Permite guardar datos corruptos o relaciones inconsistentes. | Pendiente de evidencia reproducible. |
| GRAVE | Produce `500` o expone errores internos de Express/Mongoose. | Pendiente de evidencia reproducible. |
| MENOR | El flujo funciona, pero el mensaje o código HTTP es incorrecto. | Pendiente de evidencia reproducible. |

## Orden de reparación comprometido

Completar antes de editar el código:

1. Pendiente: ataques reproducibles CRÍTICOS, ordenados por impacto.
2. Pendiente: ataques reproducibles GRAVES.
3. Pendiente: ataques reproducibles MENORES.
4. Pendiente: CRUD normal que se usará para detectar regresiones.

## Registro de reparaciones

Duplica este registro por cada hallazgo confirmado. Arregla cada problema en una sola capa y repite la misma petición para verificarlo.

```text
REPARACIÓN del ATAQUE #__
Severidad:        CRÍTICO / GRAVE / MENOR
Petición original: método, URL, headers y body
Por qué falló:    causa comprobada, no solo el síntoma
Dónde lo arreglé: archivo y capa (model / validator / middleware / controller / route)
Antes:            fragmento original
Después:          fragmento corregido
Cómo lo comprobé: misma petición, código HTTP y respuesta nueva
Regresión:        CRUD afectado que volví a probar
Estado:           abierto / corregido y verificado
```

## Segunda ronda

- Hallazgos originales cerrados: pendiente del recuento de la ronda 2.
- Regresiones detectadas: pendiente de ejecutar CRUD normal.
- Fallos nuevos: pendiente de la segunda ronda.
- Pendientes abiertos y qué se intentó: completar con evidencia.

El informe de las peticiones está en [informe.md](informe.md); las preguntas para defender las decisiones técnicas están en [defensa.md](defensa.md).