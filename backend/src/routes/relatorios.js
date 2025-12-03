const express = require('express');
const router = express.Router();
const relatoriosController = require('../controllers/relatoriosController');
const { authMiddleware } = require('../middlewares/auth');

// Aplicar autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de relatórios
router.get('/inventario-riscos', relatoriosController.inventarioRiscos);
router.get('/estatisticas-gerais', relatoriosController.estatisticasGerais);
router.get('/por-setor', relatoriosController.relatorioPorSetor);
router.get('/avaliacoes-por-setor', relatoriosController.relatorioAvaliacoesPorSetor);
router.get('/avaliacoes-detalhado', relatoriosController.relatorioDetalhadoAvaliacoes);
router.get('/consolidado', relatoriosController.relatorioConsolidado);

module.exports = router;
