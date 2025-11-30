const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { generateToken, generateRefreshToken } = require('../config/jwt');
const crypto = require('crypto');

const authController = {
  async login(req, res) {
  console.log('🔍 Login attempt:', { email: req.body.email });
  
  try {
    const { email, senha } = req.body;

    // Validação básica
    if (!email || !senha) {
      console.log('❌ Email ou senha faltando');
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    console.log('📧 Buscando usuário:', email);

    // Buscar usuário
    const userQuery = await pool.query(
      `SELECT u.*, e.razao_social, e.nome_fantasia 
       FROM usuarios u
       JOIN empresas e ON u.empresa_id = e.id
       WHERE u.email = $1 AND u.ativo = true AND e.ativo = true`,
      [email.toLowerCase()]
    );

    console.log('👤 Usuário encontrado:', userQuery.rows.length > 0);

    if (userQuery.rows.length === 0) {
      console.log('❌ Credenciais inválidas - usuário não encontrado');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = userQuery.rows[0];
    console.log('🔐 Verificando senha para usuário:', user.nome);
    console.log('🔑 Hash armazenado:', user.senha_hash.substring(0, 20) + '...');

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);

    console.log('✅ Senha válida:', senhaValida);

    if (!senhaValida) {
      console.log('❌ Senha incorreta');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

      console.log('🎫 Gerando tokens...');

      // Gerar tokens
      const accessToken = generateToken({ 
        userId: user.id, 
        empresaId: user.empresa_id,
        perfil: user.perfil 
      });
      const refreshToken = generateRefreshToken({ userId: user.id });

      // Hash dos tokens para armazenar no banco
      const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // Criar sessão
      const expiraEm = new Date();
      expiraEm.setHours(expiraEm.getHours() + 24);

      console.log('💾 Criando sessão...');

      await pool.query(
        `INSERT INTO sessoes (usuario_id, token_hash, refresh_token_hash, ip_address, user_agent, expira_em)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, tokenHash, refreshTokenHash, req.ip, req.headers['user-agent'], expiraEm]
      );

      console.log('🍪 Configurando cookies...');

      // Configurar cookies HttpOnly
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      // Retornar dados do usuário (sem senha)
      const { senha_hash, ...userData } = user;

      console.log('✅ Login realizado com sucesso!');

      return res.json({
        success: true,
        user: userData,
        message: 'Login realizado com sucesso'
      });

    } catch (error) {
    console.error('💥 Erro no login:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
},

  // Logout
  async logout(req, res) {
    try {
      const token = req.cookies.accessToken;

      if (token) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        // Desativar sessão
        await pool.query(
          'UPDATE sessoes SET ativo = false WHERE token_hash = $1',
          [tokenHash]
        );
      }

      // Limpar cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      return res.json({ success: true, message: 'Logout realizado com sucesso' });
    } catch (error) {
      console.error('Erro no logout:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Verificar autenticação
  async me(req, res) {
    try {
      return res.json({
        success: true,
        user: req.user
      });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};

module.exports = authController;