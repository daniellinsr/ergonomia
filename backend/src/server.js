const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();


const { apiLimiter } = require('./middlewares/rateLimiter');

const app = express();

// Middlewares de segurança
app.use(helmet());

// CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://ergonomia.helthcorp.com.br',
  'https://ergonomiahomolog.netlify.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Log para debug
    console.log('🔍 CORS Debug - Origin recebida:', origin);
    console.log('🔍 CORS Debug - Origins permitidas:', allowedOrigins);

    // Permitir requisições sem origin (ex: do Nginx proxy)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `A política CORS não permite acesso desta origem: ${origin}`;
      console.error('❌ CORS bloqueado:', origin);
      return callback(new Error(msg), false);
    }
    console.log('✅ CORS permitido:', origin);
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Trust proxy
app.set('trust proxy', 1);

// Rota de health check (sem rate limit)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Rotas de autenticação (rate limit aplicado internamente nas rotas específicas)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Aplicar rate limit APENAS nas rotas abaixo
app.use('/api', apiLimiter);

// Rotas com rate limit
const empresasRoutes = require('./routes/empresas');
app.use('/api/empresas', empresasRoutes);

const usuariosRoutes = require('./routes/usuarios');
app.use('/api/usuarios', usuariosRoutes);

const unidadesRoutes = require('./routes/unidades');
app.use('/api/unidades', unidadesRoutes);

const setoresRoutes = require('./routes/setores');
app.use('/api/setores', setoresRoutes);

const avaliacoesRoutes = require('./routes/avaliacoes');
app.use('/api/avaliacoes', avaliacoesRoutes);

const planos5w2hRoutes = require('./routes/planos5w2h');
app.use('/api/planos5w2h', planos5w2hRoutes);

const acoesCorretivasRoutes = require('./routes/acoesCorretivas');
app.use('/api/acoes-corretivas', acoesCorretivasRoutes);

const ciclosPDCARoutes = require('./routes/ciclosPDCA');
app.use('/api/ciclos-pdca', ciclosPDCARoutes);

const relatoriosRoutes = require('./routes/relatorios');
app.use('/api/relatorios', relatoriosRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
});

module.exports = app;