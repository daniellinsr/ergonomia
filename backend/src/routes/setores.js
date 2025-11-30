const express = require('express');
const router = express.Router();
const setorController = require('../controllers/setorController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const auditLog = require('../middlewares/auditLog');

router.use(authMiddleware);

router.get('/', setorController.listar);
router.post('/', auditLog('setores'), setorController.criar);
router.put('/:id', auditLog('setores'), setorController.atualizar);
router.patch('/:id/desativar', auditLog('setores'), setorController.desativar);
router.patch('/:id/reativar', auditLog('setores'), setorController.reativar);
router.delete('/:id', adminMiddleware, auditLog('setores'), setorController.deletar);

module.exports = router;