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
import { validarApiKey } from "../src/middlewares/validarApiKey.js";
import { login, validarJWT } from "../middlewares/token.js";
import { validarPropietario } from "../middlewares/propietario.js";

const router = Router();

router.post("/login", loginValidator, validarCampos, login);
router.post("/", usuarioCreateValidator, validarCampos, createUsuario);
router.get("/", validarApiKey, getUsuarios);
router.use(validarJWT);
router.get("/:id/perfil-numerologico", idValidator, validarCampos, validarPropietario, getPerfilNumerologico);
router.get("/:id", idValidator, validarCampos, validarPropietario, getUsuarioById);
router.put("/:id", idValidator, usuarioUpdateValidator, validarCampos, validarPropietario, updateUsuario);
router.delete("/:id", idValidator, validarCampos, validarPropietario, deleteUsuario);

export default router;
