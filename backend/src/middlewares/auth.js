const { verifyToken } = require('../config/jwt');
const pool = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    // Pegar token do cookie HttpOnly
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    // Verificar se sessão está ativa
    const sessionQuery = await pool.query(
      'SELECT * FROM sessoes WHERE usuario_id = $1 AND ativo = true AND expira_em > NOW()',
      [decoded.userId]
    );

    if (sessionQuery.rows.length === 0) {
      return res.status(401).json({ error: 'Sessão expirada ou inválida' });
    }

    // Buscar dados do usuário
    const userQuery = await pool.query(
      'SELECT id, nome, email, empresa_id, perfil FROM usuarios WHERE id = $1 AND ativo = true',
      [decoded.userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.user = userQuery.rows[0];
    next();
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Middleware para verificar se é administrador
const adminMiddleware = (req, res, next) => {
  if (req.user.perfil !== 'administrador') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };