import test from "node:test";
import assert from "node:assert/strict";
import { responderError } from "./responderError.js";

const response = () => ({
    statusCode: 200,
    body: null,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    },
});

test("responderError mapea validaciones y duplicados a estados de cliente", () => {
    const originalError = console.error;
    console.error = () => {};
    try {
        const validationResponse = response();
        responderError(validationResponse, { name: "ValidationError", message: "internal" });
        assert.equal(validationResponse.statusCode, 400);

        const duplicateResponse = response();
        responderError(duplicateResponse, { code: 11000, message: "internal" });
        assert.equal(duplicateResponse.statusCode, 409);
    } finally {
        console.error = originalError;
    }
});

test("responderError no expone detalles internos de servidor", () => {
    const originalError = console.error;
    console.error = () => {};
    try {
        const res = response();
        responderError(res, { message: "secret detail" }, "Error interno");
        assert.equal(res.statusCode, 500);
        assert.deepEqual(res.body, { error: "Error interno" });
    } finally {
        console.error = originalError;
    }
});
