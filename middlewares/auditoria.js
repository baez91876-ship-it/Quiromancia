import { BitacoraTransaccion } from "../models/bitacoraTransacciones.model.js";
import mongoose from "mongoose";

export const auditarPeticion = (req, res, next) => {
    const startedAt = Date.now();

    res.on("finish", () => {
        if (req.path.startsWith("/bitacoraTransacciones") || req.path === "/health") {
            return;
        }

        if (mongoose.connection.readyState !== 1) {
            return;
        }

        const usuarioId = req.body?.usuario_id || req.params?.id;
        const lecturaId = req.body?.lectura_id;
        const details = JSON.stringify({
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
        });

        BitacoraTransaccion.create({
            usuario_id: mongoose.isValidObjectId(usuarioId) ? usuarioId : undefined,
            lectura_id: mongoose.isValidObjectId(lecturaId) ? lecturaId : undefined,
            tipo: "http_request",
            estado: res.statusCode < 400 ? "completado" : "fallido",
            detalles: details,
        }).catch((error) => {
            console.error("No se pudo guardar la auditoría:", error.message);
        });
    });

    next();
};
