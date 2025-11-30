const express = require('express');
const router = express.Router();
const acaoCorretivaController = require('../controllers/acaoCorretivaController');
const { authMiddleware } = require('../middlewares/auth');

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas
router.get('/', acaoCorretivaController.listar);
router.get('/estatisticas', acaoCorretivaController.estatisticas);
router.get('/:id', acaoCorretivaController.buscarPorId);
router.post('/', acaoCorretivaController.criar);
router.put('/:id', acaoCorretivaController.atualizar);
router.patch('/:id/progresso', acaoCorretivaController.atualizarProgresso);
router.delete('/:id', acaoCorretivaController.excluir);

module.exports = router;
