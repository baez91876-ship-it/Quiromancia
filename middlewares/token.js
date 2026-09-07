import jwt from "jsonwebtoken";
import { Usuario } from "../models/usuarios.model.js";

const secretKey = process.env.SECRETORPRIVATEKEY || "casino_secret_key";

export const generarJWT = (uid) => {
    return new Promise((resolve, reject) => {
        const payload = { uid };

        jwt.sign(payload, secretKey, { expiresIn: "4h" }, (err, token) => {
            if (err) {
                console.error(err);
                reject(new Error("No se pudo generar el token"));
                return;
            }
            resolve(token);
        });
    });
};

export const login = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ msg: "El email es obligatorio" });
    }

    try {
        const usuario = await Usuario.findOne({ email });

        if (!usuario) {
            return res.status(400).json({ msg: "Usuario no encontrado" });
        }

        const token = await generarJWT(usuario._id.toString());

        return res.json({
            usuario,
            token,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "No se pudo iniciar sesión" });
    }
};

export const validarJWT = async (req, res, next) => {
    const authHeader = req.header("Authorization");
    const token = req.header("x-token") || (authHeader && authHeader.startsWith("Bearer ") ? authHeader.replace(/^Bearer\s+/i, "") : null);

    if (!token) {
        return res.status(401).json({ msg: "No hay token en la petición" });
    }

    try {
        const { uid } = jwt.verify(token, secretKey);
        const usuario = await Usuario.findById(uid);

        if (!usuario) {
            return res.status(401).json({ msg: "Token no válido - usuario no existe en DB" });
        }

        req.usuario = usuario;
        return next();
    } catch (error) {
        return res.status(401).json({ msg: "Token no válido" });
    }
};

export default {
    generarJWT,
    login,
    validarJWT,
};