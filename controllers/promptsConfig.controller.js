import { PromptConfig } from "../models/promptsConfig.model.js";

export const createPromptConfig = async (req, res) => {
    try {
        const { nombre, prompt, descripcion, activo, categoria, creadoPor } = req.body;
        const promptConfig = new PromptConfig({ nombre, prompt, descripcion, activo, categoria, creadoPor });
        await promptConfig.save();
        return res.status(201).json(promptConfig);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getPromptsConfig = async (req, res) => {
    try {
        const prompts = await PromptConfig.find();
        return res.status(200).json(prompts);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getPromptConfigById = async (req, res) => {
    try {
        const { id } = req.params;
        const promptConfig = await PromptConfig.findById(id);
        if (!promptConfig) {
            return res.status(404).json({ error: "PromptConfig no encontrado" });
        }
        return res.status(200).json(promptConfig);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const updatePromptConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, prompt, descripcion, activo, categoria, creadoPor } = req.body;
        const promptConfig = await PromptConfig.findByIdAndUpdate(
            id,
            { nombre, prompt, descripcion, activo, categoria, creadoPor },
            { new: true, runValidators: true }
        );
        if (!promptConfig) {
            return res.status(404).json({ error: "PromptConfig no encontrado" });
        }
        return res.status(200).json(promptConfig);
    } catch (error) {
        return res.status(500).json({ error: error.message });
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
        return res.status(500).json({ error: error.message });
    }
};
