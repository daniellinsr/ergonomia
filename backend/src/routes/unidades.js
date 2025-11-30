const express = require('express');
const router = express.Router();
const unidadeController = require('../controllers/unidadeController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const auditLog = require('../middlewares/auditLog');

router.use(authMiddleware);

router.get('/', unidadeController.listar);
router.get('/:id', unidadeController.buscarPorId);
router.post('/', auditLog('unidades'), unidadeController.criar);
router.put('/:id', auditLog('unidades'), unidadeController.atualizar);
router.patch('/:id/desativar', auditLog('unidades'), unidadeController.desativar);
router.patch('/:id/reativar', auditLog('unidades'), unidadeController.reativar);
router.delete('/:id', adminMiddleware, auditLog('unidades'), unidadeController.deletar);

module.exports = router;