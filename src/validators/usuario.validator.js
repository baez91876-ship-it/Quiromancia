import { body, checkExact } from "express-validator";

export const usuarioCreateValidator = [
    body("nombre", "El nombre es obligatorio").isString().bail().trim().notEmpty(),
    body("email", "El email es obligatorio").isEmail().normalizeEmail(),
    body("fechaNacimiento", "La fecha de nacimiento es obligatoria").isString().bail().notEmpty().isISO8601(),
    body("genero", "El género es obligatorio").notEmpty().isIn(["M", "F", "Otro"]),
    body("telefono", "El teléfono es obligatorio").isString().bail().trim().notEmpty(),
    body("password", "La contraseña debe tener 8 caracteres, un número y un símbolo")
        .isString()
        .bail()
        .isLength({ min: 8 })
        .matches(/(?=.*\d)(?=.*[^A-Za-z0-9])/),
    checkExact(undefined, { locations: ["body"] }),
];

export const usuarioUpdateValidator = [
    body("nombre").optional().isString().bail().trim().notEmpty(),
    body("email").optional().isEmail().normalizeEmail(),
    body("fechaNacimiento").optional().isString().bail().isISO8601(),
    body("genero").optional().isIn(["M", "F", "Otro"]),
    body("telefono").optional().isString().bail().trim().notEmpty(),
    checkExact(undefined, { locations: ["body"] }),
];

export const loginValidator = [
    body("email", "El email es obligatorio").isEmail().normalizeEmail(),
    body("password", "La contraseña es obligatoria").isString().notEmpty(),
    checkExact(undefined, { locations: ["body"] }),
];
