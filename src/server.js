require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`[server] Servidor rodando na porta ${PORT}`);
    console.log(`[server] http://localhost:${PORT}`);
});
