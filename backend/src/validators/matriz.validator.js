import { body, checkExact } from "express-validator";

export const matrizCreateValidator = [
    body("numeroVida", "El numeroVida es obligatorio").notEmpty().isInt({ min: 1 }),
    body("numeroDestino", "El numeroDestino es obligatorio").notEmpty().isInt({ min: 1 }),
    body("descripcion", "La descripción es obligatoria").isString().bail().notEmpty().trim(),
    body("resultado", "El resultado es obligatorio").isString().bail().notEmpty().trim(),
    checkExact(undefined, { locations: ["body"] }),
];
export const matrizUpdateValidator = [
    body("numeroVida").optional().isInt({ min: 1 }),
    body("numeroDestino").optional().isInt({ min: 1 }),
    body("descripcion").optional().isString().bail().notEmpty().trim(),
    body("resultado").optional().isString().bail().notEmpty().trim(),
    checkExact(undefined, { locations: ["body"] }),
];
