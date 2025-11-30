const express = require('express');
const router = express.Router();
const plano5W2HController = require('../controllers/plano5W2HController');
const { authMiddleware } = require('../middlewares/auth');

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas
router.get('/', plano5W2HController.listar);
router.get('/estatisticas', plano5W2HController.estatisticas);
router.get('/:id', plano5W2HController.buscarPorId);
router.post('/', plano5W2HController.criar);
router.put('/:id', plano5W2HController.atualizar);
router.patch('/:id/progresso', plano5W2HController.atualizarProgresso);
router.delete('/:id', plano5W2HController.excluir);

module.exports = router;
