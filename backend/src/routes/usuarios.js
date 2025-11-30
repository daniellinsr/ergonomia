const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const auditLog = require('../middlewares/auditLog');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Listar usuários
router.get('/', usuarioController.listar);

// Buscar usuário por ID
router.get('/:id', usuarioController.buscarPorId);

// Criar usuário (admin ou usuário da mesma empresa)
router.post('/', auditLog('usuarios'), usuarioController.criar);

// Atualizar usuário
router.put('/:id', auditLog('usuarios'), usuarioController.atualizar);

// Desativar usuário
router.patch('/:id/desativar', auditLog('usuarios'), usuarioController.desativar);

// Reativar usuário
router.patch('/:id/reativar', auditLog('usuarios'), usuarioController.reativar);

// Deletar usuário (apenas admin)
router.delete('/:id', adminMiddleware, auditLog('usuarios'), usuarioController.deletar);

module.exports = router;