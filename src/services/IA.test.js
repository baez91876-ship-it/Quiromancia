import test from "node:test";
import assert from "node:assert/strict";
import { parsearLecturaGemini } from "./IA.js";

test("parsearLecturaGemini acepta una lectura con los campos requeridos", () => {
    const lectura = parsearLecturaGemini(JSON.stringify({
        respuesta: "Lectura",
        analisis: "Análisis",
        resultado: "Conclusión",
    }));

    assert.deepEqual(lectura, {
        respuesta: "Lectura",
        analisis: "Análisis",
        resultado: "Conclusión",
    });
});

test("parsearLecturaGemini rechaza JSON inválido", () => {
    assert.throws(() => parsearLecturaGemini("{"), {
        name: "GeminiServiceError",
        message: "Gemini devolvió una respuesta JSON no válida",
    });
});

test("parsearLecturaGemini rechaza campos inesperados o ausentes", () => {
    assert.throws(() => parsearLecturaGemini(JSON.stringify({ respuesta: "Lectura" })), {
        name: "GeminiServiceError",
        message: "Gemini devolvió una lectura con un formato no válido",
    });
});
