export const validarApiKey = (req, res, next) => {
    if (!process.env.API_KEY) {
        return res.status(503).json({ error: "El servicio administrativo no está configurado" });
    }

    const apiKey = req.header('x-api-key');
    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'API key inválida' });
    }
    next();
};
