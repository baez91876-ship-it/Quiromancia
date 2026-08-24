import { body } from "express-validator";
import { Usuario } from "../../models/usuarios.model.js";

const usuarioExists = async (id) => {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
        return Promise.reject("El usuario_id no existe");
    }
};

export const matrizCreateValidator = [
    body("usuario_id", "El usuario_id es obligatorio").notEmpty().isMongoId().bail().custom(usuarioExists),
    body("numeroVida", "El numeroVida es obligatorio").notEmpty().isInt({ min: 1 }),
    body("numeroDestino", "El numeroDestino es obligatorio").notEmpty().isInt({ min: 1 }),
    body("descripcion", "La descripción es obligatoria").notEmpty().trim(),
    body("resultado", "El resultado es obligatorio").notEmpty().trim(),
];

export const matrizUpdateValidator = [
    body("usuario_id").optional().isMongoId().bail().custom(usuarioExists),
    body("numeroVida").optional().isInt({ min: 1 }),
    body("numeroDestino").optional().isInt({ min: 1 }),
    body("descripcion").optional().notEmpty().trim(),
    body("resultado").optional().notEmpty().trim(),
];
