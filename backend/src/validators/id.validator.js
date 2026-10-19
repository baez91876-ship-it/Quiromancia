import { param } from "express-validator";

export const idValidator = [
    param("id", "El id no es válido").isMongoId(),
];
