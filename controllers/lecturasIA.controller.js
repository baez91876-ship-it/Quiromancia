import { LecturaIA } from "../models/lecturasIA.model.js";
import { PromptConfig } from "../models/promptsConfig.model.js";
import { MatrizNumerologica } from "../models/matricesNumerologicas.model.js";
import { BitacoraTransaccion } from "../models/bitacoraTransacciones.model.js";
import { Usuario } from "../models/usuarios.model.js";
import { generarInterpretacion } from "../src/services/gemini.service.js";

export const generarLecturaIA = async (req, res) => {
    try {
        const { usuario_id, prompt_usado_id, metadata = {} } = req.body;
        const [usuario, prompt, matriz] = await Promise.all([
            Usuario.findById(usuario_id).select("nombre fechaNacimiento"),
            PromptConfig.findById(prompt_usado_id),
            MatrizNumerologica.findOne({ usuario_id }),
        ]);

        if (!prompt || !prompt.activo) {
            return res.status(400).json({ error: "El prompt no existe o no está activo" });
        }
        if (!matriz) {
            return res.status(400).json({ error: "No existe una matriz numerológica para este usuario" });
        }

        const respuesta = await generarInterpretacion({
            prompt: prompt.prompt,
            usuario,
            matriz,
            metadata,
        });
        const lectura = await LecturaIA.create({
            usuario_id,
            prompt_usado_id,
            respuesta,
            analisis: "Interpretación generada por Gemini con ingeniería de prompts numerológica",
            metadata,
            resultado: "generado",
        });
        const bitacora = await BitacoraTransaccion.create({
            usuario_id,
            lectura_id: lectura._id,
            tipo: "lectura_gemini",
            monto: 0,
            estado: "completado",
            detalles: "Lectura generada por Gemini con prompt activo",
        });

        return res.status(201).json({ lectura, bitacora });
    } catch (error) {
        return res.status(502).json({ error: error.message });
    }
};

export const createLecturaIA = async (req, res) => {
    try {
        const { usuario_id, prompt_usado_id, respuesta, analisis, metadata, resultado } = req.body;

        const prompt = await PromptConfig.findById(prompt_usado_id);
        if (!prompt || !prompt.activo) {
            return res.status(400).json({ error: "El prompt no existe o no está activo" });
        }

        const matriz = await MatrizNumerologica.findOne({ usuario_id });
        if (!matriz) {
            return res.status(400).json({ error: "No existe una matriz numerológica para este usuario" });
        }

        const lectura = new LecturaIA({ usuario_id, prompt_usado_id, respuesta, analisis, metadata, resultado });
        await lectura.save();

        const bitacora = new BitacoraTransaccion({
            usuario_id,
            lectura_id: lectura._id,
            tipo: "lectura",
            monto: 0,
            estado: "completado",
            detalles: "Lectura generada con prompt activo",
        });
        await bitacora.save();

        return res.status(201).json({ lectura, bitacora });
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
