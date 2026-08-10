import { MatrizNumerologica } from "../models/matricesNumerologicas.model.js";

export const createMatrizNumerologica = async (req, res) => {
    try {
        const { usuario_id, numeroVida, numeroDestino, descripcion, resultado } = req.body;
        const matriz = new MatrizNumerologica({ usuario_id, numeroVida, numeroDestino, descripcion, resultado });
        await matriz.save();
        return res.status(201).json(matriz);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getMatricesNumerologicas = async (req, res) => {
    try {
        const matrices = await MatrizNumerologica.find();
        return res.status(200).json(matrices);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getMatrizNumerologicaById = async (req, res) => {
    try {
        const { id } = req.params;
        const matriz = await MatrizNumerologica.findById(id);
        if (!matriz) {
            return res.status(404).json({ error: "Matriz numerológica no encontrada" });
        }
        return res.status(200).json(matriz);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const updateMatrizNumerologica = async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario_id, numeroVida, numeroDestino, descripcion, resultado } = req.body;
        const matriz = await MatrizNumerologica.findByIdAndUpdate(
            id,
            { usuario_id, numeroVida, numeroDestino, descripcion, resultado },
            { new: true, runValidators: true }
        );
        if (!matriz) {
            return res.status(404).json({ error: "Matriz numerológica no encontrada" });
        }
        return res.status(200).json(matriz);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteMatrizNumerologica = async (req, res) => {
    try {
        const { id } = req.params;
        const matriz = await MatrizNumerologica.findByIdAndDelete(id);
        if (!matriz) {
            return res.status(404).json({ error: "Matriz numerológica no encontrada" });
        }
        return res.status(200).json({ message: "Matriz eliminada correctamente" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getMatrizConUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const matriz = await MatrizNumerologica.findById(id).populate("usuario_id");
        if (!matriz) {
            return res.status(404).json({ error: "Matriz numerológica no encontrada" });
        }
        return res.status(200).json(matriz);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
