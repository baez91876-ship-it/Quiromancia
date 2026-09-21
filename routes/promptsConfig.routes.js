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
import { validarJWT } from "../middlewares/token.js";

const router = Router();

router.post("/", validarJWT, promptCreateValidator, validarCampos, createPromptConfig);
router.get("/", validarJWT, getPromptsConfig);
router.get("/:id", validarJWT, idValidator, validarCampos, getPromptConfigById);
router.put("/:id", validarJWT, idValidator, promptUpdateValidator, validarCampos, updatePromptConfig);
router.delete("/:id", validarJWT, idValidator, validarCampos, deletePromptConfig);

export default router;
