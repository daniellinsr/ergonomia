const pool = require('../config/database');

// Mapear métodos HTTP para ações
const getAcao = (method, recurso) => {
  const acaoMap = {
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE',
    'GET': 'READ'
  };
  return acaoMap[method] || 'UNKNOWN';
};

const auditLog = (recurso) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      try {
        // Calcular duração da requisição
        const duracao_ms = Date.now() - startTime;

        // Mapear método para ação
        const acao = getAcao(req.method, recurso);

        // Preparar dados para auditoria (compatível com migration 012)
        const auditData = {
          usuario_id: req.user?.id || null,
          empresa_id: req.user?.empresa_id || null,
          acao: acao,
          recurso: recurso,
          metodo: req.method,
          endpoint: req.originalUrl || req.url,
          status_code: res.statusCode,
          ip_address: req.ip || req.connection.remoteAddress || null,
          user_agent: req.headers['user-agent'] || null,
          request_body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : null,
          response_body: res.statusCode < 400 ? data : null,
          erro: res.statusCode >= 400 ? JSON.stringify(data) : null,
          duracao_ms: duracao_ms
        };

        // Tentar registrar auditoria
        await pool.query(
          `INSERT INTO auditoria_log
           (usuario_id, empresa_id, acao, recurso, metodo, endpoint, status_code,
            ip_address, user_agent, request_body, response_body, erro, duracao_ms)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            auditData.usuario_id,
            auditData.empresa_id,
            auditData.acao,
            auditData.recurso,
            auditData.metodo,
            auditData.endpoint,
            auditData.status_code,
            auditData.ip_address,
            auditData.user_agent,
            auditData.request_body ? JSON.stringify(auditData.request_body) : null,
            auditData.response_body ? JSON.stringify(auditData.response_body) : null,
            auditData.erro,
            auditData.duracao_ms
          ]
        );

      } catch (error) {
        // Log mais detalhado do erro, mas não bloqueia a resposta
        if (error.code === '42P01') {
          // Tabela não existe - log apenas uma vez para evitar spam
          console.error('⚠️  [Auditoria] Tabela auditoria_log não existe. Execute a migration 012.');
        } else {
          console.error('❌ [Auditoria] Erro ao registrar:', {
            erro: error.message,
            code: error.code,
            recurso: recurso,
            endpoint: req.originalUrl
          });
        }
      }

      return originalJson(data);
    };

    next();
  };
};

module.exports = auditLog;