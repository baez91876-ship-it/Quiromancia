import { body } from "express-validator";

export const usuarioCreateValidator = [
    body("nombre", "El nombre es obligatorio").notEmpty().trim(),
    body("email", "El email es obligatorio").isEmail().normalizeEmail(),
    body("fechaNacimiento", "La fecha de nacimiento es obligatoria").notEmpty().isISO8601(),
    body("genero", "El género es obligatorio").notEmpty().isIn(["M", "F", "Otro"]),
    body("telefono", "El teléfono es obligatorio").notEmpty().trim(),
];

export const usuarioUpdateValidator = [
    body("nombre").optional().notEmpty().trim(),
    body("email").optional().isEmail().normalizeEmail(),
    body("fechaNacimiento").optional().isISO8601(),
    body("genero").optional().isIn(["M", "F", "Otro"]),
    body("telefono").optional().notEmpty().trim(),
];
