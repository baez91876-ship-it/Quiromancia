import { Router } from "express";
import {
    createLecturaIA,
    getLecturasIA,
    getLecturaIAById,
    updateLecturaIA,
    deleteLecturaIA,
    getLecturaCompleta,
} from "../controllers/lecturasIA.controller.js";

const router = Router();

router.post("/", createLecturaIA);
router.get("/", getLecturasIA);
router.get("/detallada/:id", getLecturaCompleta);
router.get("/:id", getLecturaIAById);
router.put("/:id", updateLecturaIA);
router.delete("/:id", deleteLecturaIA);

export default router;
