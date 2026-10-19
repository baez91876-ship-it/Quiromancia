import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { BitacoraTransaccion } from "../models/bitacoraTransacciones.model.js";
import { LecturaIA } from "../models/lecturasIA.model.js";
import { MatrizNumerologica } from "../models/matricesNumerologicas.model.js";
import { PromptConfig } from "../models/promptsConfig.model.js";
import { Usuario } from "../models/usuarios.model.js";

const userId = "65a000000000000000000001";
const otherUserId = "65a000000000000000000002";

const runRequest = async (handler, req = {}) => {
    let statusCode = 200;
    let body;
    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(value) {
            body = value;
            return this;
        },
    };
    await handler({ header: () => "", ...req }, res, (error) => {
        if (error) throw error;
    });
    return { statusCode, body };
};

const startServer = async (app) => {
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
    });
    return server;
};

test("los cinco modelos declaran los campos requeridos principales", () => {
    assert.equal(Usuario.schema.path("email").isRequired, true);
    assert.equal(Usuario.schema.path("password").options.select, false);
    assert.equal(MatrizNumerologica.schema.path("numeroVida").isRequired, true);
    assert.equal(PromptConfig.schema.path("prompt").isRequired, true);
    assert.equal(LecturaIA.schema.path("respuesta").isRequired, true);
    assert.equal(BitacoraTransaccion.schema.path("tipo").isRequired, true);
});

test("validarJWT rechaza solicitudes sin token", async () => {
    const previousSecret = process.env.SECRETORPRIVATEKEY;
    process.env.SECRETORPRIVATEKEY = "unit-test-secret";
    try {
        const result = await runRequest((await import("../middlewares/token.js")).validarJWT);
        assert.equal(result.statusCode, 401);
    } finally {
        if (previousSecret === undefined) delete process.env.SECRETORPRIVATEKEY;
        else process.env.SECRETORPRIVATEKEY = previousSecret;
    }
});

test("API protege matrices, valida propietario y calcula perfil autenticado", async (t) => {
    const originals = {
        secret: process.env.SECRETORPRIVATEKEY,
        apiKey: process.env.API_KEY,
        findUser: Usuario.findById,
        findMatrices: MatrizNumerologica.find,
        updateUser: Usuario.findByIdAndUpdate,
        updateMatrix: MatrizNumerologica.findOneAndUpdate,
    };
    process.env.SECRETORPRIVATEKEY = "api-test-secret";
    delete process.env.API_KEY;

    const user = {
        _id: userId,
        nombre: "José Núñez",
        email: "jose@example.test",
        fechaNacimiento: new Date("1990-01-01T00:00:00.000Z"),
    };
    let matrixFilter;
    let matrixUpdate;
    Usuario.findById = () => ({ select: async () => user });
    Usuario.findByIdAndUpdate = async (_id, data) => Object.assign(user, data);
    MatrizNumerologica.find = async (filter) => {
        matrixFilter = filter;
        return [];
    };
    MatrizNumerologica.findOneAndUpdate = async (filter, update) => {
        matrixUpdate = { filter, update };
        return {};
    };

    const server = await startServer(createApp());
    t.after(async () => {
        await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
        Usuario.findById = originals.findUser;
        Usuario.findByIdAndUpdate = originals.updateUser;
        MatrizNumerologica.find = originals.findMatrices;
        MatrizNumerologica.findOneAndUpdate = originals.updateMatrix;
        if (originals.secret === undefined) delete process.env.SECRETORPRIVATEKEY;
        else process.env.SECRETORPRIVATEKEY = originals.secret;
        if (originals.apiKey === undefined) delete process.env.API_KEY;
        else process.env.API_KEY = originals.apiKey;
    });

    const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
    const token = jwt.sign({ uid: userId }, process.env.SECRETORPRIVATEKEY);
    const authHeaders = { Authorization: `Bearer ${token}` };

    assert.equal((await fetch(`${baseUrl}/matricesNumerologicas`)).status, 401);
    assert.equal((await fetch(`${baseUrl}/usuarios/${otherUserId}/perfil-numerologico`, { headers: authHeaders })).status, 403);

    const matricesResponse = await fetch(`${baseUrl}/matricesNumerologicas`, { headers: authHeaders });
    assert.equal(matricesResponse.status, 200);
    assert.deepEqual(matrixFilter, { usuario_id: userId });

    const profileResponse = await fetch(`${baseUrl}/usuarios/${userId}/perfil-numerologico`, { headers: authHeaders });
    const profile = await profileResponse.json();
    assert.equal(profileResponse.status, 200);
    assert.equal(profile.numeroVida, 3);
    assert.equal(profile.numeroDestino, 3);

    const updateResponse = await fetch(`${baseUrl}/usuarios/${userId}`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: "Ana Pérez" }),
    });
    assert.equal(updateResponse.status, 200);
    assert.deepEqual(matrixUpdate.filter, { usuario_id: userId });
    assert.equal(matrixUpdate.update.numeroVida, 5);

    const ownerOverride = await fetch(`${baseUrl}/matricesNumerologicas`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
            usuario_id: otherUserId,
            numeroVida: 1,
            numeroDestino: 1,
            descripcion: "Prueba",
            resultado: "Prueba",
        }),
    });
    assert.equal(ownerOverride.status, 400);

    const originalError = console.error;
    console.error = () => {};
    try {
        const invalidJson = await fetch(`${baseUrl}/matricesNumerologicas`, {
            method: "POST",
            headers: { ...authHeaders, "Content-Type": "application/json" },
            body: "{",
        });
        assert.equal(invalidJson.status, 400);
    } finally {
        console.error = originalError;
    }

    const originalApiKey = process.env.API_KEY;
    process.env.API_KEY = "admin-test-secret";
    try {
        assert.equal((await fetch(`${baseUrl}/bitacoraTransacciones`)).status, 401);
    } finally {
        if (originalApiKey === undefined) delete process.env.API_KEY;
        else process.env.API_KEY = originalApiKey;
    }

    delete process.env.API_KEY;
    assert.equal((await fetch(`${baseUrl}/promptsConfig`, { method: "POST" })).status, 503);
});
