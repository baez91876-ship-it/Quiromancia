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

const router = Router();

router.post("/", bitacoraCreateValidator, validarCampos, createBitacoraTransaccion);
router.get("/", getBitacoraTransacciones);
router.get("/:id", idValidator, validarCampos, getBitacoraTransaccionById);
router.put("/:id", idValidator, bitacoraUpdateValidator, validarCampos, updateBitacoraTransaccion);
router.delete("/:id", idValidator, validarCampos, deleteBitacoraTransaccion);

export default router;
