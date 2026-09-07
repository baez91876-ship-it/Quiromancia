import bcryptjs from 'bcryptjs';
import { Usuario } from '../models/usuarios.model.js';

export const createUsuario = async (req, res) => {
    try {
        const { nombre, email, fechaNacimiento, genero, telefono, password } = req.body;

        const salt = bcryptjs.genSaltSync();
        const hashedPassword = bcryptjs.hashSync(password, salt);

        const usuario = new Usuario({ nombre, email, fechaNacimiento, genero, telefono, password: hashedPassword });
        await usuario.save();

        const usuarioSinPassword = usuario.toObject();
        delete usuarioSinPassword.password;

        return res.status(201).json(usuarioSinPassword);
    } catch (error) {
        return res.status(400).json({ error: error.message });
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
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        return res.status(200).json(usuario);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioActualizado = await Usuario.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!usuarioActualizado) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        return res.status(200).json(usuarioActualizado);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

export const deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioEliminado = await Usuario.findByIdAndDelete(id);

        if (!usuarioEliminado) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        return res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};