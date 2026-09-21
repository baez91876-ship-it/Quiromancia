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

const router = Router();

router.post("/", matrizCreateValidator, validarCampos, createMatrizNumerologica);
router.get("/", getMatricesNumerologicas);
router.get("/completa/:id", idValidator, validarCampos, getMatrizConUsuario);
router.get("/:id", idValidator, validarCampos, getMatrizNumerologicaById);
router.put("/:id", idValidator, matrizUpdateValidator, validarCampos, updateMatrizNumerologica);
router.delete("/:id", idValidator, validarCampos, deleteMatrizNumerologica);

export default router;
