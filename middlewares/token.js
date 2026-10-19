import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { Usuario } from "../models/usuarios.model.js";
import { asegurarMatrizNumerologica } from "../src/services/numerologia.service.js";

const getSecretKey = () => process.env.SECRETORPRIVATEKEY;

export const generarJWT = (uid) => {
    return new Promise((resolve, reject) => {
        const secretKey = getSecretKey();
        if (!secretKey) {
            reject(Object.assign(new Error("Falta configurar SECRETORPRIVATEKEY"), { statusCode: 503 }));
            return;
        }

        const payload = { uid };

        jwt.sign(payload, secretKey, { expiresIn: "4h" }, (err, token) => {
            if (err) {
                reject(new Error("No se pudo generar el token", { cause: err }));
                return;
            }
            resolve(token);
        });
    });
};

export const validarJWT = async (req, res, next) => {
    const secretKey = getSecretKey();
    if (!secretKey) {
        return res.status(503).json({ error: "El servicio de autenticación no está configurado" });
    }

    const authorization = req.header("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) {
        return res.status(401).json({ error: "Se requiere iniciar sesión" });
    }

    let payload;
    try {
        payload = jwt.verify(token, secretKey);
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: "La sesión no es válida o expiró" });
        }
        return next(error);
    }

    try {
        const usuario = await Usuario.findById(payload.uid).select("_id nombre email fechaNacimiento");
        if (!usuario) {
            return res.status(401).json({ error: "La cuenta asociada a esta sesión ya no existe" });
        }

        req.usuario = usuario;
        return next();
    } catch (error) {
        return next(error);
    }
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

        await asegurarMatrizNumerologica(usuario);
        const token = await generarJWT(usuario._id.toString());
        const usuarioSinPassword = usuario.toObject();
        delete usuarioSinPassword.password;

        return res.json({
            usuario: usuarioSinPassword,
            token,
        });
    } catch (error) {
        console.error("No se pudo iniciar sesión:", error);
        return res.status(error.statusCode || 500).json({
            error: error.statusCode ? error.message : "No se pudo iniciar sesión",
        });
    }
};