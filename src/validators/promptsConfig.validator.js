import { body } from "express-validator";
import { Usuario } from "../../models/usuarios.model.js";

const usuarioExists = async (id) => {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
        return Promise.reject("El creadoPor no existe");
    }
};

export const promptCreateValidator = [
    body("nombre", "El nombre es obligatorio").trim().notEmpty().isLength({ max: 100 }),
    body("prompt", "El prompt es obligatorio y máximo 2000 caracteres").trim().notEmpty().isLength({ max: 2000 }),
    body("descripcion", "La descripción es obligatoria").trim().notEmpty().isLength({ max: 500 }),
    body("categoria", "La categoría es obligatoria").trim().notEmpty(),
    body("tipo_lectura", "El tipo de lectura es obligatorio").trim().notEmpty(),
    body("creadoPor", "El creador es obligatorio").notEmpty().isMongoId().bail().custom(usuarioExists),
];

export const promptUpdateValidator = [
    body("nombre").optional().trim().notEmpty().isLength({ max: 100 }),
    body("prompt").optional().trim().notEmpty().isLength({ max: 2000 }),
    body("descripcion").optional().trim().notEmpty().isLength({ max: 500 }),
    body("categoria").optional().trim().notEmpty(),
    body("tipo_lectura").optional().trim().notEmpty(),
    body("creadoPor").optional().isMongoId().bail().custom(usuarioExists),
];
