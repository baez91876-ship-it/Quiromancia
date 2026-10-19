export const responderError = (res, error, mensajeInterno = "No se pudo completar la operación") => {
    console.error(error);

    if (error.name === "ValidationError" || error.name === "CastError") {
        return res.status(400).json({ error: "Los datos enviados no son válidos" });
    }

    if (error.code === 11000) {
        return res.status(409).json({ error: "Ya existe un registro con esos datos" });
    }

    const statusCode = Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode <= 599
        ? error.statusCode
        : 500;
    return res.status(statusCode).json({
        error: statusCode < 500 ? error.message : mensajeInterno,
    });
};
