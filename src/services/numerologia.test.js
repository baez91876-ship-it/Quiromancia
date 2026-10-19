import test from "node:test";
import assert from "node:assert/strict";
import {
    calcularNumeroDestino,
    calcularNumeroNombre,
    calcularPerfilNumerologico,
    reducirNumero,
} from "./numerologia.service.js";

test("reducirNumero suma dígitos hasta obtener una cifra", () => {
    assert.equal(reducirNumero(9876), 3);
    assert.equal(reducirNumero(9), 9);
    assert.equal(reducirNumero(-18), 9);
    assert.equal(reducirNumero(Number.NaN), 0);
});

test("calcularNumeroNombre admite tildes y ñ", () => {
    assert.equal(calcularNumeroNombre("José Núñez"), 3);
    assert.equal(calcularNumeroNombre("!!!"), 0);
});

test("calcularNumeroDestino es estable con fechas ISO", () => {
    assert.equal(calcularNumeroDestino("1990-01-01"), 3);
    assert.equal(calcularNumeroDestino("fecha inválida"), 0);
});

test("calcularPerfilNumerologico devuelve valores coherentes", () => {
    const perfil = calcularPerfilNumerologico({
        nombre: "José Núñez",
        fechaNacimiento: "1990-01-01",
    });
    assert.equal(perfil.numeroVida, 3);
    assert.equal(perfil.numeroDestino, 3);
    assert.equal(perfil.resultado.numeroVida, perfil.numeroVida);
});
