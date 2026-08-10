import { Router } from "express";
import {
    createPromptConfig,
    getPromptsConfig,
    getPromptConfigById,
    updatePromptConfig,
    deletePromptConfig,
} from "../controllers/promptsConfig.controller.js";

const router = Router();

router.post("/", createPromptConfig);
router.get("/", getPromptsConfig);
router.get("/:id", getPromptConfigById);
router.put("/:id", updatePromptConfig);
router.delete("/:id", deletePromptConfig);

export default router;
