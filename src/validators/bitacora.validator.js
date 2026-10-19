import { body, checkExact } from "express-validator";
import { Usuario } from "../../models/usuarios.model.js";
import { LecturaIA } from "../../models/lecturasIA.model.js";

const usuarioExists = async (id) => {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
        return Promise.reject("El usuario_id no existe");
    }
};

const lecturaExists = async (id) => {
    const lectura = await LecturaIA.findById(id);
    if (!lectura) {
        return Promise.reject("El lectura_id no existe");
    }
};

export const bitacoraCreateValidator = [
    body("usuario_id", "El usuario_id es obligatorio").notEmpty().isMongoId().bail().custom(usuarioExists),
    body("lectura_id", "El lectura_id es obligatorio").notEmpty().isMongoId().bail().custom(lecturaExists),
    body("tipo", "El tipo es obligatorio").isString().bail().notEmpty().trim(),
    body("monto", "El monto es obligatorio").notEmpty().isFloat({ min: 0 }),
    body("estado", "El estado es obligatorio").isString().bail().notEmpty().trim(),
    body("detalles", "Los detalles son obligatorios").isString().bail().notEmpty().trim(),
    checkExact(undefined, { locations: ["body"] }),
];

export const bitacoraUpdateValidator = [
    body("usuario_id").optional().isMongoId().bail().custom(usuarioExists),
    body("lectura_id").optional().isMongoId().bail().custom(lecturaExists),
    body("tipo").optional().isString().bail().notEmpty().trim(),
    body("monto").optional().isFloat({ min: 0 }),
    body("estado").optional().isString().bail().notEmpty().trim(),
    body("detalles").optional().isString().bail().notEmpty().trim(),
    checkExact(undefined, { locations: ["body"] }),
];
