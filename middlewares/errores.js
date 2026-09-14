export const manejarErrores = (error, _req, res, _next) => {
    console.error(error);

    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({ error: "El cuerpo JSON no es válido" });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
        return res.status(400).json({ error: "Los datos enviados no son válidos" });
    }

    return res.status(error.statusCode || 500).json({
        error: error.statusCode ? error.message : "Error interno del servidor",
    });
};
