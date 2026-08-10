import { Usuario } from "../models/usuarios.model.js";

export const createUsuario = async (req, res) => {
    try {
        const { nombre, email, fechaNacimiento, genero, telefono } = req.body;
        const usuario = new Usuario({ nombre, email, fechaNacimiento, genero, telefono });
        await usuario.save();
        return res.status(201).json(usuario);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find();
        return res.status(200).json(usuarios);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getUsuarioById = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuario.findById(id);
        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        return res.status(200).json(usuario);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, fechaNacimiento, genero, telefono } = req.body;
        const usuario = await Usuario.findByIdAndUpdate(
            id,
            { nombre, email, fechaNacimiento, genero, telefono },
            { new: true, runValidators: true }
        );
        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        return res.status(200).json(usuario);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuario.findByIdAndDelete(id);
        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        return res.status(200).json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
