import bcryptjs from 'bcryptjs';
import { Usuario } from '../models/usuarios.model.js';
import { LecturaIA } from '../models/lecturasIA.model.js';
import { MatrizNumerologica } from '../models/matricesNumerologicas.model.js';
import {
    actualizarMatrizNumerologica,
    calcularPerfilNumerologico,
    asegurarMatrizNumerologica,
} from '../src/services/numerologia.service.js';
import { responderError } from '../src/utils/responderError.js';

export const createUsuario = async (req, res) => {
    let usuario;
    try {
        const { nombre, email, fechaNacimiento, genero, telefono, password } = req.body;

        const hashedPassword = await bcryptjs.hash(password, 12);

        usuario = new Usuario({ nombre, email, fechaNacimiento, genero, telefono, password: hashedPassword });
        await usuario.save();
        await asegurarMatrizNumerologica(usuario);

        const usuarioSinPassword = usuario.toObject();
        delete usuarioSinPassword.password;

        return res.status(201).json(usuarioSinPassword);
    } catch (error) {
        if (usuario?._id) {
            try {
                await MatrizNumerologica.deleteMany({ usuario_id: usuario._id });
                await Usuario.findByIdAndDelete(usuario._id);
            } catch (rollbackError) {
                console.error('No se pudo revertir el registro incompleto:', rollbackError);
            }
        }
        console.error('No se pudo crear el usuario y su matriz:', error);
        return res.status(error.name === 'ValidationError' ? 400 : error.code === 11000 ? 409 : 500).json({
            error: error.name === 'ValidationError'
                ? 'Los datos del usuario no son válidos'
                : error.code === 11000
                    ? 'Ya existe una cuenta con ese correo'
                    : 'No se pudo crear la cuenta',
        });
    }
};

export const getUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find();
        return res.status(200).json(usuarios);
    } catch (error) {
        return responderError(res, error, 'No se pudieron consultar los usuarios');
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
        return responderError(res, error, 'No se pudo consultar el usuario');
    }
};

export const updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, fechaNacimiento, genero, telefono } = req.body;
        const updateData = {};
        if (nombre !== undefined) updateData.nombre = nombre;
        if (email !== undefined) updateData.email = email;
        if (fechaNacimiento !== undefined) updateData.fechaNacimiento = fechaNacimiento;
        if (genero !== undefined) updateData.genero = genero;
        if (telefono !== undefined) updateData.telefono = telefono;

        const usuarioActualizado = await Usuario.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!usuarioActualizado) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (nombre !== undefined || fechaNacimiento !== undefined) {
            await actualizarMatrizNumerologica(usuarioActualizado);
        }

        return res.status(200).json(usuarioActualizado);
    } catch (error) {
        return responderError(res, error, 'No se pudo actualizar el usuario');
    }
};

export const deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const lecturasAsociadas = await LecturaIA.countDocuments({ usuario_id: id });
        if (lecturasAsociadas > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar el usuario porque tiene lecturas registradas. Elimine primero sus lecturas.',
            });
        }

        const usuarioEliminado = await Usuario.findByIdAndDelete(id);

        if (!usuarioEliminado) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        return res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        return responderError(res, error, 'No se pudo eliminar el usuario');
    }
};

export const getPerfilNumerologico = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id).select('nombre fechaNacimiento email');
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        if (!usuario.fechaNacimiento) {
            return res.status(400).json({ error: 'El usuario no tiene fecha de nacimiento' });
        }

        return res.status(200).json({
            usuario: usuario._id,
            nombre: usuario.nombre,
            ...calcularPerfilNumerologico({
                nombre: usuario.nombre,
                fechaNacimiento: usuario.fechaNacimiento,
            }),
        });
    } catch (error) {
        return responderError(res, error, 'No se pudo calcular el perfil numerológico');
    }
};