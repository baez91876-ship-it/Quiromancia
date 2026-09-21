import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { Usuario } from "../models/usuarios.model.js";

const getSecretKey = () => {
    if (!process.env.SECRETORPRIVATEKEY) {
        throw new Error("SECRETORPRIVATEKEY no está configurada");
    }
    return process.env.SECRETORPRIVATEKEY;
};

export const validarJWT = (req, res, next) => {
    const authorization = req.header("Authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: "Se requiere un token Bearer" });
    }

    try {
        const { uid } = jwt.verify(token, getSecretKey());
        req.usuarioId = uid;
        return next();
    } catch {
        return res.status(401).json({ error: "El token no es válido o ha expirado" });
    }
};

export const generarJWT = (uid) => {
    return new Promise((resolve, reject) => {
        const payload = { uid };

        jwt.sign(payload, getSecretKey(), { expiresIn: "4h" }, (err, token) => {
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
    const { email, password } = req.body;

    try {
        const usuario = await Usuario.findOne({ email }).select("+password");

        if (!usuario) {
            return res.status(401).json({ error: "Email o contraseña incorrectos" });
        }

        const validPassword = bcryptjs.compareSync(password, usuario.password);

        if (!validPassword) {
            return res.status(401).json({ error: "Email o contraseña incorrectos" });
        }

        const token = await generarJWT(usuario._id.toString());
        const usuarioSinPassword = usuario.toObject();
        delete usuarioSinPassword.password;

        return res.json({
            usuario: usuarioSinPassword,
            token,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "No se pudo iniciar sesión" });
    }
};