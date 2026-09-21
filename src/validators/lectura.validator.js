import { body } from "express-validator";
import { Usuario } from "../../models/usuarios.model.js";
import { PromptConfig } from "../../models/promptsConfig.model.js";

const usuarioExists = async (id) => {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
        return Promise.reject("El usuario_id no existe");
    }
};

const promptExists = async (id) => {
    const prompt = await PromptConfig.findById(id);
    if (!prompt) {
        return Promise.reject("El prompt_usado_id no existe");
    }
};

export const lecturaCreateValidator = [
    body("usuario_id", "El usuario_id es obligatorio").notEmpty().isMongoId().bail().custom(usuarioExists),
    body("prompt_usado_id", "El prompt_usado_id es obligatorio").notEmpty().isMongoId().bail().custom(promptExists),
    body("respuesta", "La respuesta es obligatoria").notEmpty().trim(),
    body("analisis", "El análisis es obligatorio").notEmpty().trim(),
    body("metadata", "La metadata es obligatoria").notEmpty(),
    body("resultado", "El resultado es obligatorio").notEmpty().trim(),
];

export const lecturaGenerarValidator = [
    body("usuario_id", "El usuario_id es obligatorio").notEmpty().isMongoId().bail().custom(usuarioExists),
    body("prompt_usado_id", "El prompt_usado_id es obligatorio").notEmpty().isMongoId().bail().custom(promptExists),
    body("metadata").optional().isObject(),
];

export const lecturaUpdateValidator = [
    body("usuario_id").optional().isMongoId().bail().custom(usuarioExists),
    body("prompt_usado_id").optional().isMongoId().bail().custom(promptExists),
    body("respuesta").optional().notEmpty().trim(),
    body("analisis").optional().notEmpty().trim(),
    body("metadata").optional(),
    body("resultado").optional().notEmpty().trim(),
];
