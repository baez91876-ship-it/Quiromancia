import { Router } from "express";
import {
    createLecturaIA,
    getLecturasIA,
    getLecturaIAById,
    updateLecturaIA,
    deleteLecturaIA,
    getLecturaCompleta,
} from "../controllers/lecturasIA.controller.js";
import { lecturaCreateValidator, lecturaUpdateValidator } from "../src/validators/lectura.validator.js";
import { idValidator } from "../src/validators/id.validator.js";
import { validarCampos } from "../src/middlewares/validarCampos.js";
import { validarApiKey } from "../src/middlewares/validarApiKey.js";

const router = Router();

router.post("/", validarApiKey, lecturaCreateValidator, validarCampos, createLecturaIA);
router.get("/", getLecturasIA);
router.get("/detallada/:id", idValidator, validarCampos, getLecturaCompleta);
router.get("/:id", idValidator, validarCampos, getLecturaIAById);
router.put("/:id", idValidator, lecturaUpdateValidator, validarCampos, updateLecturaIA);
router.delete("/:id", idValidator, validarCampos, deleteLecturaIA);

export default router;
