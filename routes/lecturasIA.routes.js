import { Router } from "express";
import {
    createLecturaIA,
    getLecturasIA,
    getLecturaIAById,
    deleteLecturaIA,
    getLecturaCompleta,
} from "../controllers/lecturasIA.controller.js";
import { lecturaCreateValidator } from "../src/validators/lectura.validator.js";
import { idValidator } from "../src/validators/id.validator.js";
import { validarCampos } from "../src/middlewares/validarCampos.js";
import { validarJWT } from "../middlewares/token.js";

const router = Router();

router.use(validarJWT);
router.get("/", getLecturasIA);
router.post("/", lecturaCreateValidator, validarCampos, createLecturaIA);
router.get("/detallada/:id", idValidator, validarCampos, getLecturaCompleta);
router.get("/:id", idValidator, validarCampos, getLecturaIAById);
router.delete("/:id", idValidator, validarCampos, deleteLecturaIA);

export default router;
