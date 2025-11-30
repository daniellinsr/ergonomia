const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresaController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const auditLog = require('../middlewares/auditLog');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Listar empresas (admin vê todas, usuário vê só a sua)
router.get('/', empresaController.listar);

// Buscar empresa por ID
router.get('/:id', empresaController.buscarPorId);

// Criar empresa (apenas admin)
router.post('/', adminMiddleware, auditLog('empresas'), empresaController.criar);

// Atualizar empresa (admin ou própria empresa)
router.put('/:id', auditLog('empresas'), empresaController.atualizar);

// Desativar empresa (apenas admin)
router.patch('/:id/desativar', adminMiddleware, auditLog('empresas'), empresaController.desativar);

// Reativar empresa (apenas admin)
router.patch('/:id/reativar', adminMiddleware, auditLog('empresas'), empresaController.reativar);

// Deletar empresa permanentemente (apenas admin)
router.delete('/:id', adminMiddleware, auditLog('empresas'), empresaController.deletar);

module.exports = router;