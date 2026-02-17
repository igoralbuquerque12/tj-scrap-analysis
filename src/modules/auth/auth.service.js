/**
 * Auth middleware.
 * Verifies the "x-api-key" header against the API_KEY environment variable.
 */
function authMiddleware(req, res, next) {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({ error: 'API key não fornecida.' });
    }

    if (apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'API key inválida.' });
    }

    next();
}

module.exports = { authMiddleware };
