import test from "node:test";
import assert from "node:assert/strict";
import { GeminiServiceError, parsearLecturaGemini } from "./IA.js";
import { GEMINI_MODEL } from "../../config/gemini.js";

test("Gemini usa el modelo configurado para el proyecto", () => {
    assert.equal(GEMINI_MODEL, "gemini-3.8-flash");
});

test("la clave Gemini se carga desde .env y no se imprime", async () => {
    const { geminiConfigured } = await import("../../config/gemini.js");
    assert.equal(geminiConfigured, Boolean(process.env.GEMINI_API_KEY?.trim()));
});

test("parsearLecturaGemini acepta los tres campos requeridos", () => {
    assert.deepEqual(parsearLecturaGemini(JSON.stringify({
        respuesta: "Lectura personalizada",
        analisis: "Análisis numerológico",
        resultado: "Conclusión",
    })), {
        respuesta: "Lectura personalizada",
        analisis: "Análisis numerológico",
        resultado: "Conclusión",
    });
});

test("parsearLecturaGemini rechaza JSON inválido", () => {
    assert.throws(() => parsearLecturaGemini("{"), GeminiServiceError);
});

test("parsearLecturaGemini rechaza campos ausentes o vacíos", () => {
    assert.throws(() => parsearLecturaGemini(JSON.stringify({ respuesta: " " })), GeminiServiceError);
});
