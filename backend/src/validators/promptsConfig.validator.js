import { body, checkExact } from "express-validator";
import { Usuario } from "../../models/usuarios.model.js";

const usuarioExists = async (id) => {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
        return Promise.reject("El creadoPor no existe");
    }
};

export const promptCreateValidator = [
    body("nombre", "El nombre es obligatorio").isString().bail().trim().notEmpty().isLength({ max: 100 }),
    body("prompt", "El prompt es obligatorio y máximo 2000 caracteres").isString().bail().trim().notEmpty().isLength({ max: 2000 }),
    body("descripcion", "La descripción es obligatoria").isString().bail().trim().notEmpty().isLength({ max: 500 }),
    body("categoria", "La categoría es obligatoria").isString().bail().trim().notEmpty(),
    body("tipo_lectura", "El tipo de lectura es obligatorio").isString().bail().trim().notEmpty(),
    body("creadoPor", "El creador es obligatorio").notEmpty().isMongoId().bail().custom(usuarioExists),
    checkExact(undefined, { locations: ["body"] }),
];

export const promptUpdateValidator = [
    body("nombre").optional().isString().bail().trim().notEmpty().isLength({ max: 100 }),
    body("prompt").optional().isString().bail().trim().notEmpty().isLength({ max: 2000 }),
    body("descripcion").optional().isString().bail().trim().notEmpty().isLength({ max: 500 }),
    body("activo").optional().isBoolean(),
    body("categoria").optional().isString().bail().trim().notEmpty(),
    body("tipo_lectura").optional().isString().bail().trim().notEmpty(),
    body("creadoPor").optional().isMongoId().bail().custom(usuarioExists),
    checkExact(undefined, { locations: ["body"] }),
];
