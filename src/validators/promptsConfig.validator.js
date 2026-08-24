import { body } from "express-validator";
import { Usuario } from "../../models/usuarios.model.js";

const usuarioExists = async (id) => {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
        return Promise.reject("El creadoPor no existe");
    }
};

export const promptCreateValidator = [
    body("nombre", "El nombre es obligatorio").notEmpty().trim(),
    body("prompt", "El prompt es obligatorio").notEmpty().trim(),
    body("descripcion", "La descripción es obligatoria").notEmpty().trim(),
    body("categoria", "La categoría es obligatoria").notEmpty().trim(),
    body("tipo_lectura", "El tipo de lectura es obligatorio").notEmpty().trim(),
    body("creadoPor", "El creador es obligatorio").notEmpty().isMongoId().bail().custom(usuarioExists),
];

export const promptUpdateValidator = [
    body("nombre").optional().notEmpty().trim(),
    body("prompt").optional().notEmpty().trim(),
    body("descripcion").optional().notEmpty().trim(),
    body("categoria").optional().notEmpty().trim(),
    body("tipo_lectura").optional().notEmpty().trim(),
    body("creadoPor").optional().isMongoId().bail().custom(usuarioExists),
];
