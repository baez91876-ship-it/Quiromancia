import { body } from "express-validator";

export const usuarioCreateValidator = [
    body("nombre", "El nombre es obligatorio").trim().notEmpty(),
    body("email", "El email es obligatorio").isEmail().normalizeEmail(),
    body("fechaNacimiento", "La fecha de nacimiento es obligatoria").notEmpty().isISO8601(),
    body("genero", "El género es obligatorio").notEmpty().isIn(["M", "F", "Otro"]),
    body("telefono", "El teléfono es obligatorio").trim().notEmpty(),
    body("password", "La contraseña debe tener al menos 6 caracteres").isLength({ min: 6 }),
];

export const usuarioUpdateValidator = [
    body("nombre").optional().trim().notEmpty(),
    body("email").optional().isEmail().normalizeEmail(),
    body("fechaNacimiento").optional().isISO8601(),
    body("genero").optional().isIn(["M", "F", "Otro"]),
    body("telefono").optional().trim().notEmpty(),
];

export const loginValidator = [
    body("email", "El email es obligatorio").isEmail().normalizeEmail(),
    body("password", "La contraseña es obligatoria").notEmpty(),
];
