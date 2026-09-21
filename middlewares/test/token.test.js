import test from "node:test";
import assert from "node:assert/strict";

process.env.SECRETORPRIVATEKEY = "test-secret-key";
const { generarJWT, validarJWT } = await import("../token.js");

test("genera y valida un JWT Bearer", async () => {
    const token = await generarJWT("usuario-123");
    let nextCalled = false;
    const response = {
        status: () => response,
        json: (body) => body,
    };
    const request = {
        header: (name) => name === "Authorization" ? `Bearer ${token}` : undefined,
    };

    validarJWT(request, response, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(request.usuarioId, "usuario-123");
});

test("rechaza una petición sin Bearer token", () => {
    let nextCalled = false;
    const response = {
        statusCode: 0,
        status: (code) => { response.statusCode = code; return response; },
        json: (body) => body,
    };

    validarJWT({ header: () => undefined }, response, () => { nextCalled = true; });

    assert.equal(response.statusCode, 401);
    assert.equal(nextCalled, false);
});
