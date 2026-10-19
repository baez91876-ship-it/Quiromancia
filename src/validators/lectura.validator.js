import { body } from "express-validator";
import { PromptConfig } from "../../models/promptsConfig.model.js";

const promptExists = async (id) => {
    const prompt = await PromptConfig.findOne({ _id: id, activo: true });
    if (!prompt) {
        return Promise.reject("El prompt_usado_id no existe o no está activo");
    }
};

export const lecturaCreateValidator = [
    body("prompt_usado_id", "El prompt_usado_id es obligatorio").notEmpty().isMongoId().bail().custom(promptExists),
];
