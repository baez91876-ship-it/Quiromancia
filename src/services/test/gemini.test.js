import test from "node:test";
import assert from "node:assert/strict";
import { construirPromptLectura } from "../gemini.service.js";

test("construye un prompt estructurado con datos numerológicos", () => {
    const prompt = construirPromptLectura({
        prompt: "Interpreta el perfil con cuidado.",
        usuario: { nombre: "Ana" },
        matriz: { numeroVida: 11, numeroDestino: 7 },
        metadata: { tipo_lectura: "personalidad", mano: "derecha" },
    });

    assert.match(prompt, /Interpreta el perfil con cuidado/);
    assert.match(prompt, /Número de vida: 11/);
    assert.match(prompt, /Número de destino: 7/);
    assert.match(prompt, /Tipo de lectura: personalidad/);
    assert.match(prompt, /No presentes la numerología como una predicción comprobable/);
});
