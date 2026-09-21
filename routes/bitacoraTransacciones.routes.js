import { Router } from "express";
import {
    createBitacoraTransaccion,
    getBitacoraTransacciones,
    getBitacoraTransaccionById,
    updateBitacoraTransaccion,
    deleteBitacoraTransaccion,
} from "../controllers/bitacoraTransacciones.controller.js";
import { bitacoraCreateValidator, bitacoraUpdateValidator } from "../src/validators/bitacora.validator.js";
import { idValidator } from "../src/validators/id.validator.js";
import { validarCampos } from "../src/middlewares/validarCampos.js";
import { validarJWT } from "../middlewares/token.js";

const router = Router();

router.post("/", validarJWT, bitacoraCreateValidator, validarCampos, createBitacoraTransaccion);
router.get("/", validarJWT, getBitacoraTransacciones);
router.get("/:id", validarJWT, idValidator, validarCampos, getBitacoraTransaccionById);
router.put("/:id", validarJWT, idValidator, bitacoraUpdateValidator, validarCampos, updateBitacoraTransaccion);
router.delete("/:id", validarJWT, idValidator, validarCampos, deleteBitacoraTransaccion);

export default router;
