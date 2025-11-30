const express = require('express');
const router = express.Router();
const trabalhadorController = require('../controllers/trabalhadorController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const auditLog = require('../middlewares/auditLog');

router.use(authMiddleware);

router.get('/', trabalhadorController.listar);
router.get('/:id', trabalhadorController.buscarPorId);
router.post('/', auditLog('trabalhadores'), trabalhadorController.criar);
router.put('/:id', auditLog('trabalhadores'), trabalhadorController.atualizar);
router.patch('/:id/desativar', auditLog('trabalhadores'), trabalhadorController.desativar);
router.patch('/:id/reativar', auditLog('trabalhadores'), trabalhadorController.reativar);
router.delete('/:id', adminMiddleware, auditLog('trabalhadores'), trabalhadorController.deletar);

module.exports = router;