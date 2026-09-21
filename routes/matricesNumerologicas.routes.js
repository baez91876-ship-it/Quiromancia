import { Router } from "express";
import {
    createMatrizNumerologica,
    getMatricesNumerologicas,
    getMatrizNumerologicaById,
    updateMatrizNumerologica,
    deleteMatrizNumerologica,
    getMatrizConUsuario,
} from "../controllers/matricesNumerologicas.controller.js";
import { matrizCreateValidator, matrizUpdateValidator } from "../src/validators/matriz.validator.js";
import { idValidator } from "../src/validators/id.validator.js";
import { validarCampos } from "../src/middlewares/validarCampos.js";
import { validarJWT } from "../middlewares/token.js";

const router = Router();

router.post("/", validarJWT, matrizCreateValidator, validarCampos, createMatrizNumerologica);
router.get("/", validarJWT, getMatricesNumerologicas);
router.get("/completa/:id", validarJWT, idValidator, validarCampos, getMatrizConUsuario);
router.get("/:id", validarJWT, idValidator, validarCampos, getMatrizNumerologicaById);
router.put("/:id", validarJWT, idValidator, matrizUpdateValidator, validarCampos, updateMatrizNumerologica);
router.delete("/:id", validarJWT, idValidator, validarCampos, deleteMatrizNumerologica);

export default router;
