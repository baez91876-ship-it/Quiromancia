import { Router } from "express";
import {
    createLecturaIA,
    getLecturasIA,
    getLecturaIAById,
    updateLecturaIA,
    deleteLecturaIA,
    getLecturaCompleta,
    generarLecturaIA,
} from "../controllers/lecturasIA.controller.js";
import { lecturaCreateValidator, lecturaGenerarValidator, lecturaUpdateValidator } from "../src/validators/lectura.validator.js";
import { idValidator } from "../src/validators/id.validator.js";
import { validarCampos } from "../src/middlewares/validarCampos.js";
import { validarApiKey } from "../src/middlewares/validarApiKey.js";
import { validarJWT } from "../middlewares/token.js";

const router = Router();

router.get("/", validarJWT, getLecturasIA);
router.post("/generar", validarJWT, validarApiKey, lecturaGenerarValidator, validarCampos, generarLecturaIA);
router.post("/", validarJWT, validarApiKey, lecturaCreateValidator, validarCampos, createLecturaIA);
router.get("/detallada/:id", validarJWT, idValidator, validarCampos, getLecturaCompleta);
router.get("/:id", validarJWT, idValidator, validarCampos, getLecturaIAById);
router.put("/:id", validarJWT, idValidator, lecturaUpdateValidator, validarCampos, updateLecturaIA);
router.delete("/:id", validarJWT, idValidator, validarCampos, deleteLecturaIA);

export default router;
