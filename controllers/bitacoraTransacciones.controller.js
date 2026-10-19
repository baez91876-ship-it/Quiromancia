import { BitacoraTransaccion } from "../models/bitacoraTransacciones.model.js";
import { responderError } from "../src/utils/responderError.js";

export const createBitacoraTransaccion = async (req, res) => {
    try {
        const { usuario_id, lectura_id, tipo, monto, estado, detalles } = req.body;
        const transaccion = new BitacoraTransaccion({ usuario_id, lectura_id, tipo, monto, estado, detalles });
        await transaccion.save();
        return res.status(201).json(transaccion);
    } catch (error) {
        return responderError(res, error, "No se pudo crear el registro de auditoría");
    }
};

export const getBitacoraTransacciones = async (req, res) => {
    try {
        const transacciones = await BitacoraTransaccion.find();
        return res.status(200).json(transacciones);
    } catch (error) {
        return responderError(res, error, "No se pudo consultar la auditoría");
    }
};

export const getBitacoraTransaccionById = async (req, res) => {
    try {
        const { id } = req.params;
        const transaccion = await BitacoraTransaccion.findById(id);
        if (!transaccion) {
            return res.status(404).json({ error: "BitacoraTransaccion no encontrada" });
        }
        return res.status(200).json(transaccion);
    } catch (error) {
        return responderError(res, error, "No se pudo consultar el registro de auditoría");
    }
};

export const updateBitacoraTransaccion = async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario_id, lectura_id, tipo, monto, estado, detalles } = req.body;
        const transaccion = await BitacoraTransaccion.findByIdAndUpdate(
            id,
            { usuario_id, lectura_id, tipo, monto, estado, detalles },
            { new: true, runValidators: true }
        );
        if (!transaccion) {
            return res.status(404).json({ error: "BitacoraTransaccion no encontrada" });
        }
        return res.status(200).json(transaccion);
    } catch (error) {
        return responderError(res, error, "No se pudo actualizar el registro de auditoría");
    }
};

export const deleteBitacoraTransaccion = async (req, res) => {
    try {
        const { id } = req.params;
        const transaccion = await BitacoraTransaccion.findByIdAndDelete(id);
        if (!transaccion) {
            return res.status(404).json({ error: "BitacoraTransaccion no encontrada" });
        }
        return res.status(200).json({ message: "BitacoraTransaccion eliminada correctamente" });
    } catch (error) {
        return responderError(res, error, "No se pudo eliminar el registro de auditoría");
    }
};
