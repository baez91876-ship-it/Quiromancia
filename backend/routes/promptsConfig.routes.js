import { Router } from "express";
import {
    createPromptConfig,
    getPromptsConfig,
    getPromptConfigById,
    updatePromptConfig,
    deletePromptConfig,
} from "../controllers/promptsConfig.controller.js";
import { promptCreateValidator, promptUpdateValidator } from "../src/validators/promptsConfig.validator.js";
import { idValidator } from "../src/validators/id.validator.js";
import { validarCampos } from "../src/middlewares/validarCampos.js";
import { validarApiKey } from "../src/middlewares/validarApiKey.js";

const router = Router();

router.post("/", validarApiKey, promptCreateValidator, validarCampos, createPromptConfig);
router.get("/", getPromptsConfig);
router.get("/:id", idValidator, validarCampos, getPromptConfigById);
router.put("/:id", validarApiKey, idValidator, promptUpdateValidator, validarCampos, updatePromptConfig);
router.delete("/:id", validarApiKey, idValidator, validarCampos, deletePromptConfig);

export default router;
