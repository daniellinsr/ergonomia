const express = require('express');
const router = express.Router();
const cicloPDCAController = require('../controllers/cicloPDCAController');
const { authMiddleware } = require('../middlewares/auth');

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas
router.get('/', cicloPDCAController.listar);
router.get('/estatisticas', cicloPDCAController.estatisticas);
router.get('/:id', cicloPDCAController.buscarPorId);
router.post('/', cicloPDCAController.criar);
router.put('/:id', cicloPDCAController.atualizar);
router.patch('/:id/avancar-fase', cicloPDCAController.avancarFase);
router.patch('/:id/progresso', cicloPDCAController.atualizarProgresso);
router.delete('/:id', cicloPDCAController.excluir);

module.exports = router;
