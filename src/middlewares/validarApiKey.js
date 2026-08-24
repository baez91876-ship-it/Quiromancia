export const validarApiKey = (req, res, next) => {
    const apiKey = req.header('x-api-key') || req.query.api_key;
    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'API key inválida' });
    }
    next();
};
