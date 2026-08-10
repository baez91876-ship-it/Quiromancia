import { LecturaIA } from "../models/lecturasIA.model.js";

export const createLecturaIA = async (req, res) => {
    try {
        const { usuario_id, prompt_usado_id, respuesta, analisis, metadata, resultado } = req.body;
        const lectura = new LecturaIA({ usuario_id, prompt_usado_id, respuesta, analisis, metadata, resultado });
        await lectura.save();
        return res.status(201).json(lectura);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getLecturasIA = async (req, res) => {
    try {
        const lecturas = await LecturaIA.find();
        return res.status(200).json(lecturas);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getLecturaIAById = async (req, res) => {
    try {
        const { id } = req.params;
        const lectura = await LecturaIA.findById(id);
        if (!lectura) {
            return res.status(404).json({ error: "LecturaIA no encontrada" });
        }
        return res.status(200).json(lectura);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const updateLecturaIA = async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario_id, prompt_usado_id, respuesta, analisis, metadata, resultado } = req.body;
        const lectura = await LecturaIA.findByIdAndUpdate(
            id,
            { usuario_id, prompt_usado_id, respuesta, analisis, metadata, resultado },
            { new: true, runValidators: true }
        );
        if (!lectura) {
            return res.status(404).json({ error: "LecturaIA no encontrada" });
        }
        return res.status(200).json(lectura);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteLecturaIA = async (req, res) => {
    try {
        const { id } = req.params;
        const lectura = await LecturaIA.findByIdAndDelete(id);
        if (!lectura) {
            return res.status(404).json({ error: "LecturaIA no encontrada" });
        }
        return res.status(200).json({ message: "LecturaIA eliminada correctamente" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getLecturaCompleta = async (req, res) => {
    try {
        const { id } = req.params;
        const lectura = await LecturaIA.findById(id)
            .populate("usuario_id")
            .populate("prompt_usado_id");
        if (!lectura) {
            return res.status(404).json({ error: "LecturaIA no encontrada" });
        }
        return res.status(200).json(lectura);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
