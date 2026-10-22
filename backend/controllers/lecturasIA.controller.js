import { LecturaIA } from "../models/lecturasIA.model.js";
import { PromptConfig } from "../models/promptsConfig.model.js";
import { MatrizNumerologica } from "../models/matricesNumerologicas.model.js";
import { BitacoraTransaccion } from "../models/bitacoraTransacciones.model.js";
import { generarLectura, GeminiServiceError } from "../src/services/IA.js";
import { GEMINI_MODEL } from "../config/gemini.js";
import { responderError } from "../src/utils/responderError.js";

const responderLecturaExistente = async (res, lectura) => {
    const bitacora = await BitacoraTransaccion.findOne({ lectura_id: lectura._id, tipo: "lectura" });
    return res.status(200).json({ lectura, bitacora, cached: true });
};

const construirFiltroLectura = ({ usuario_id, prompt_usado_id, prompt, matriz, consulta }) => ({
    usuario_id,
    prompt_usado_id,
    prompt_actualizado_en: prompt.updatedAt || prompt.createdAt,
    matriz_id: matriz._id,
    matriz_actualizada_en: matriz.updatedAt || matriz.fecha,
    consulta,
});

// Las lecturas guardadas antes de existir el campo no tienen "consulta".
const filtroBusqueda = (filtro) => (filtro.consulta ? filtro : { ...filtro, consulta: { $in: [null, ""] } });

export const createLecturaIA = async (req, res) => {
    try {
        const { prompt_usado_id } = req.body;
        const consulta = req.body.consulta?.trim() || "";
        const usuario_id = req.usuario._id;

        const prompt = await PromptConfig.findOne({ _id: prompt_usado_id, activo: true });
        if (!prompt || !prompt.activo) {
            return res.status(400).json({ error: "El prompt no existe o no está activo" });
        }

        const matriz = await MatrizNumerologica.findOne({ usuario_id });
        if (!matriz) {
            return res.status(400).json({ error: "No existe una matriz numerológica para este usuario" });
        }

        const filtroLectura = construirFiltroLectura({ usuario_id, prompt_usado_id, prompt, matriz, consulta });
        const lecturaExistente = await LecturaIA.findOne(filtroBusqueda(filtroLectura));
        if (lecturaExistente) {
            return await responderLecturaExistente(res, lecturaExistente);
        }

        const contenido = await generarLectura({ promptConfig: prompt, matriz, consulta });
        const lectura = new LecturaIA({
            ...filtroLectura,
            ...contenido,
            metadata: {
                modelo: GEMINI_MODEL,
                generadaEn: new Date(),
            },
        });
        await lectura.save();

        const bitacora = new BitacoraTransaccion({
            usuario_id,
            lectura_id: lectura._id,
            tipo: "lectura",
            monto: 0,
            estado: "completado",
            detalles: consulta ? "Lectura generada con consulta del usuario" : "Lectura generada con prompt activo",
        });
        await bitacora.save();

        return res.status(201).json({ lectura, bitacora, cached: false });
    } catch (error) {
        if (error instanceof GeminiServiceError) {
            console.error("Error en el servicio de Gemini:", {
                message: error.message,
                cause: error.cause?.name,
                status: error.cause?.status,
            });
            return res.status(503).json({ error: error.message });
        }

        if (error.code === 11000) {
            try {
                const { prompt_usado_id } = req.body;
                const consulta = req.body.consulta?.trim() || "";
                const usuario_id = req.usuario._id;
                const [matriz, prompt] = await Promise.all([
                    MatrizNumerologica.findOne({ usuario_id }),
                    PromptConfig.findById(prompt_usado_id),
                ]);
                const lecturaExistente = matriz && prompt
                    ? await LecturaIA.findOne(filtroBusqueda(
                        construirFiltroLectura({ usuario_id, prompt_usado_id, prompt, matriz, consulta })
                    ))
                    : null;
                if (lecturaExistente) {
                    return await responderLecturaExistente(res, lecturaExistente);
                }
            } catch (lookupError) {
                console.error("Error al recuperar una lectura existente:", lookupError);
            }
        }

        console.error("Error al guardar la lectura:", error);
        return responderError(res, error, "No se pudo guardar la lectura");
    }
};

export const getLecturasIA = async (req, res) => {
    try {
        const lecturas = await LecturaIA.find({ usuario_id: req.usuario._id }).sort({ fecha: -1 }).limit(50);
        return res.status(200).json(lecturas);
    } catch (error) {
        return responderError(res, error, "No se pudieron consultar las lecturas");
    }
};

export const getLecturaIAById = async (req, res) => {
    try {
        const { id } = req.params;
        const lectura = await LecturaIA.findOne({ _id: id, usuario_id: req.usuario._id });
        if (!lectura) {
            return res.status(404).json({ error: "LecturaIA no encontrada" });
        }
        return res.status(200).json(lectura);
    } catch (error) {
        return responderError(res, error, "No se pudo consultar la lectura");
    }
};

export const deleteLecturaIA = async (req, res) => {
    try {
        const { id } = req.params;
        const lectura = await LecturaIA.findOneAndDelete({ _id: id, usuario_id: req.usuario._id });
        if (!lectura) {
            return res.status(404).json({ error: "LecturaIA no encontrada" });
        }
        return res.status(200).json({ message: "LecturaIA eliminada correctamente" });
    } catch (error) {
        return responderError(res, error, "No se pudo eliminar la lectura");
    }
};

export const getLecturaCompleta = async (req, res) => {
    try {
        const { id } = req.params;
        const lectura = await LecturaIA.findOne({ _id: id, usuario_id: req.usuario._id })
            .populate("usuario_id", "nombre email")
            .populate("prompt_usado_id", "nombre descripcion categoria tipo_lectura");
        if (!lectura) {
            return res.status(404).json({ error: "LecturaIA no encontrada" });
        }
        return res.status(200).json(lectura);
    } catch (error) {
        return responderError(res, error, "No se pudo consultar la lectura completa");
    }
};
