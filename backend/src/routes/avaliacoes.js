const express = require('express');
const router = express.Router();
const avaliacaoController = require('../controllers/avaliacaoController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const auditLog = require('../middlewares/auditLog');

router.use(authMiddleware);

router.get('/', avaliacaoController.listar);
router.get('/:id', avaliacaoController.buscarPorId);
router.post('/', auditLog('avaliacoes_ergonomicas'), avaliacaoController.criar);
router.patch('/:id/perigo/:perigoId', avaliacaoController.togglePerigo);
router.post('/:id/perigo/:perigoId/classificar', auditLog('classificacao_risco'), avaliacaoController.classificarRisco);
router.patch('/:id/finalizar', auditLog('avaliacoes_ergonomicas'), avaliacaoController.finalizar);
router.patch('/:id/reabrir', auditLog('avaliacoes_ergonomicas'), avaliacaoController.reabrir);
router.delete('/:id', adminMiddleware, auditLog('avaliacoes_ergonomicas'), avaliacaoController.deletar);

module.exports = router;