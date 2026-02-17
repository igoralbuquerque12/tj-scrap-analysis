const { Router } = require("express");
const { authMiddleware } = require("../auth/auth.service");
const { collectAll, collectAndAnalyze } = require("./data-collection.service");

const router = Router();

/**
 * GET /data-collection
 * Executa a coleta de todas as fontes e retorna os resultados.
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { results, warnings } = await collectAll();

    return res.json({
      success: true,
      warnings,
      data: results,
    });
  } catch (error) {
    console.error("[data-collection] Erro inesperado:", error.message);
    return res.status(500).json({
      success: false,
      error: "Erro interno ao coletar dados.",
    });
  }
});

/**
 * GET /data-collection/analyze
 * Coleta dados de todos os tribunais e envia para a OpenAI analisar
 * possíveis impactos em automações e scrapers.
 */
router.get("/analyze", authMiddleware, async (req, res) => {
  try {
    const { analysis, warnings, usage } = await collectAndAnalyze();

    return res.json({
      success: true,
      warnings,
      usage,
      data: analysis,
    });
  } catch (error) {
    console.error("[data-collection] Erro na análise:", error.message);
    return res.status(500).json({
      success: false,
      error: "Erro interno ao analisar dados.",
    });
  }
});

module.exports = router;
