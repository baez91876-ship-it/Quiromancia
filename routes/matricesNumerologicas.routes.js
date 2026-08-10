import { Router } from "express";
import {
    createMatrizNumerologica,
    getMatricesNumerologicas,
    getMatrizNumerologicaById,
    updateMatrizNumerologica,
    deleteMatrizNumerologica,
    getMatrizConUsuario,
} from "../controllers/matricesNumerologicas.controller.js";

const router = Router();

router.post("/", createMatrizNumerologica);
router.get("/", getMatricesNumerologicas);
router.get("/completa/:id", getMatrizConUsuario);
router.get("/:id", getMatrizNumerologicaById);
router.put("/:id", updateMatrizNumerologica);
router.delete("/:id", deleteMatrizNumerologica);

export default router;
