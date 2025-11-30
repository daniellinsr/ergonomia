const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginLimiter } = require('../middlewares/rateLimiter');
const { authMiddleware } = require('../middlewares/auth');

// Login com rate limit
router.post('/login', loginLimiter, authController.login);

// Logout e me SEM rate limit (são rotas autenticadas)
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me); // Sem rate limit

module.exports = router;