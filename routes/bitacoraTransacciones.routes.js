import { Router } from "express";
import {
    createBitacoraTransaccion,
    getBitacoraTransacciones,
    getBitacoraTransaccionById,
    updateBitacoraTransaccion,
    deleteBitacoraTransaccion,
} from "../controllers/bitacoraTransacciones.controller.js";

const router = Router();

router.post("/", createBitacoraTransaccion);
router.get("/", getBitacoraTransacciones);
router.get("/:id", getBitacoraTransaccionById);
router.put("/:id", updateBitacoraTransaccion);
router.delete("/:id", deleteBitacoraTransaccion);

export default router;
