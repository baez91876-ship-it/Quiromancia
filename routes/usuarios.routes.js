import { Router } from "express";
import {
    createUsuario,
    getUsuarios,
    getUsuarioById,
    updateUsuario,
    deleteUsuario,
} from "../controllers/usuarios.controller.js";
import { usuarioCreateValidator, usuarioUpdateValidator } from "../src/validators/usuario.validator.js";
import { idValidator } from "../src/validators/id.validator.js";
import { validarCampos } from "../src/middlewares/validarCampos.js";

const router = Router();

router.post("/", usuarioCreateValidator, validarCampos, createUsuario);
router.get("/", getUsuarios);
router.get("/:id", idValidator, validarCampos, getUsuarioById);
router.put("/:id", idValidator, usuarioUpdateValidator, validarCampos, updateUsuario);
router.delete("/:id", idValidator, validarCampos, deleteUsuario);

export default router;
