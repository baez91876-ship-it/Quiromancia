export const validarPropietario = (req, res, next) => {
    if (req.usuario?._id?.toString() !== req.params.id) {
        return res.status(403).json({ error: "No tienes permiso para acceder a este recurso" });
    }

    return next();
};
