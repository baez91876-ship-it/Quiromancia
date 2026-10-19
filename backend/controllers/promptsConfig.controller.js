import { PromptConfig } from "../models/promptsConfig.model.js";
import { responderError } from "../src/utils/responderError.js";

export const createPromptConfig = async (req, res) => {
    try {
        const { nombre, prompt, descripcion, categoria, tipo_lectura, creadoPor } = req.body;
        const promptConfig = new PromptConfig({ nombre, prompt, descripcion, categoria, tipo_lectura, creadoPor });
        await promptConfig.save();
        return res.status(201).json(promptConfig);
    } catch (error) {
        return responderError(res, error, "No se pudo crear la plantilla");
    }
};

export const getPromptsConfig = async (req, res) => {
    try {
        const prompts = await PromptConfig.find({ activo: true })
            .select("nombre descripcion categoria tipo_lectura")
            .sort({ nombre: 1 });
        return res.status(200).json(prompts);
    } catch (error) {
        return responderError(res, error, "No se pudieron consultar las plantillas");
    }
};

export const getPromptConfigById = async (req, res) => {
    try {
        const { id } = req.params;
        const promptConfig = await PromptConfig.findById(id)
            .select("nombre descripcion activo categoria tipo_lectura creadoPor createdAt updatedAt");
        if (!promptConfig) {
            return res.status(404).json({ error: "PromptConfig no encontrado" });
        }
        return res.status(200).json(promptConfig);
    } catch (error) {
        return responderError(res, error, "No se pudo consultar la plantilla");
    }
};

export const updatePromptConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, prompt, descripcion, activo, categoria, tipo_lectura, creadoPor } = req.body;
        const promptConfig = await PromptConfig.findByIdAndUpdate(
            id,
            { nombre, prompt, descripcion, activo, categoria, tipo_lectura, creadoPor },
            { new: true, runValidators: true }
        );
        if (!promptConfig) {
            return res.status(404).json({ error: "PromptConfig no encontrado" });
        }
        return res.status(200).json(promptConfig);
    } catch (error) {
        return responderError(res, error, "No se pudo actualizar la plantilla");
    }
};

export const deletePromptConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const promptConfig = await PromptConfig.findByIdAndDelete(id);
        if (!promptConfig) {
            return res.status(404).json({ error: "PromptConfig no encontrado" });
        }
        return res.status(200).json({ message: "PromptConfig eliminado correctamente" });
    } catch (error) {
        return responderError(res, error, "No se pudo eliminar la plantilla");
    }
};
