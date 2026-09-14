import test from "node:test";
import assert from "node:assert/strict";
import {
    calcularPerfilNumerologico,
    reducirNumero,
    sumarFechaNacimiento,
    sumarNombre,
} from "../src/services/numerologia.service.js";

test("reduce una suma numerológica a un dígito", () => {
    assert.equal(reducirNumero(1990), 1);
    assert.equal(reducirNumero(29), 11);
    assert.equal(reducirNumero(38), 11);
});

test("conserva números maestros 11, 22 y 33", () => {
    assert.equal(reducirNumero(22), 22);
    assert.equal(reducirNumero(33), 33);
});

test("calcula número de vida a partir de fecha", () => {
    assert.equal(sumarFechaNacimiento("1988-02-01"), 11);
});

test("calcula número de destino a partir del nombre", () => {
    assert.equal(sumarNombre("Ana"), 7);
});

test("calcula el perfil completo", () => {
    assert.deepEqual(calcularPerfilNumerologico({
        nombre: "Ana",
        fechaNacimiento: "1988-02-01",
    }), {
        numeroVida: 11,
        numeroDestino: 7,
    });
});
