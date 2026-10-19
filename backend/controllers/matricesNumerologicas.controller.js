import { MatrizNumerologica } from "../models/matricesNumerologicas.model.js";
import { responderError } from "../src/utils/responderError.js";

export const createMatrizNumerologica = async (req, res) => {
    try {
        const { numeroVida, numeroDestino, descripcion, resultado } = req.body;
        const usuario_id = req.usuario._id;
        const matriz = new MatrizNumerologica({ usuario_id, numeroVida, numeroDestino, descripcion, resultado });
        await matriz.save();
        return res.status(201).json(matriz);
    } catch (error) {
        return responderError(res, error, "No se pudo crear la matriz numerológica");
    }
};

export const getMatricesNumerologicas = async (req, res) => {
    try {
        const matrices = await MatrizNumerologica.find({ usuario_id: req.usuario._id });
        return res.status(200).json(matrices);
    } catch (error) {
        return responderError(res, error, "No se pudieron consultar las matrices numerológicas");
    }
};

export const getMatrizNumerologicaById = async (req, res) => {
    try {
        const { id } = req.params;
        const matriz = await MatrizNumerologica.findOne({ _id: id, usuario_id: req.usuario._id });
        if (!matriz) {
            return res.status(404).json({ error: "Matriz numerológica no encontrada" });
        }
        return res.status(200).json(matriz);
    } catch (error) {
        return responderError(res, error, "No se pudo consultar la matriz numerológica");
    }
};

export const updateMatrizNumerologica = async (req, res) => {
    try {
        const { id } = req.params;
        const { numeroVida, numeroDestino, descripcion, resultado } = req.body;
        const updateData = Object.fromEntries(
            Object.entries({ numeroVida, numeroDestino, descripcion, resultado })
                .filter(([, value]) => value !== undefined)
        );
        const matriz = await MatrizNumerologica.findOneAndUpdate(
            { _id: id, usuario_id: req.usuario._id },
            updateData,
            { new: true, runValidators: true }
        );
        if (!matriz) {
            return res.status(404).json({ error: "Matriz numerológica no encontrada" });
        }
        return res.status(200).json(matriz);
    } catch (error) {
        return responderError(res, error, "No se pudo actualizar la matriz numerológica");
    }
};

export const deleteMatrizNumerologica = async (req, res) => {
    try {
        const { id } = req.params;
        const matriz = await MatrizNumerologica.findOneAndDelete({ _id: id, usuario_id: req.usuario._id });
        if (!matriz) {
            return res.status(404).json({ error: "Matriz numerológica no encontrada" });
        }
        return res.status(200).json({ message: "Matriz eliminada correctamente" });
    } catch (error) {
        return responderError(res, error, "No se pudo eliminar la matriz numerológica");
    }
};

export const getMatrizConUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const matriz = await MatrizNumerologica.findOne({ _id: id, usuario_id: req.usuario._id })
            .populate("usuario_id", "nombre email");
        if (!matriz) {
            return res.status(404).json({ error: "Matriz numerológica no encontrada" });
        }
        return res.status(200).json(matriz);
    } catch (error) {
        return responderError(res, error, "No se pudo consultar la matriz completa");
    }
};
