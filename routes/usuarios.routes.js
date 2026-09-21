import { Router } from "express";
import {
    createUsuario,
    getUsuarios,
    getUsuarioById,
    updateUsuario,
    deleteUsuario,
    getPerfilNumerologico,
} from "../controllers/usuarios.controller.js";
import { loginValidator, usuarioCreateValidator, usuarioUpdateValidator } from "../src/validators/usuario.validator.js";
import { idValidator } from "../src/validators/id.validator.js";
import { validarCampos } from "../src/middlewares/validarCampos.js";
import { login, validarJWT } from "../middlewares/token.js";

const router = Router();

router.post("/login", loginValidator, validarCampos, login);
router.post("/", usuarioCreateValidator, validarCampos, createUsuario);
router.get("/", validarJWT, getUsuarios);
router.get("/:id/perfil-numerologico", validarJWT, idValidator, validarCampos, getPerfilNumerologico);
router.get("/:id", validarJWT, idValidator, validarCampos, getUsuarioById);
router.put("/:id", validarJWT, idValidator, usuarioUpdateValidator, validarCampos, updateUsuario);
router.delete("/:id", validarJWT, idValidator, validarCampos, deleteUsuario);

export default router;
