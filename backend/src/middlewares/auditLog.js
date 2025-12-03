const pool = require('../config/database');

const auditLog = (tabela) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      try {
        // Só registra se a operação foi bem-sucedida
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const operacao = req.method === 'POST' ? 'INSERT' : 
                          req.method === 'PUT' || req.method === 'PATCH' ? 'UPDATE' : 
                          req.method === 'DELETE' ? 'DELETE' : null;

          if (operacao) {
            const registroId = data?.data?.id || data.id || req.params.id || null;

            await pool.query(
              `INSERT INTO auditoria_log 
               (tabela, operacao, registro_id, usuario_id, empresa_id, dados_novos, ip_address, user_agent)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                tabela,
                operacao,
                registroId,
                req.user?.id,
                req.user?.empresa_id,
                JSON.stringify(data),
                req.ip,
                req.headers['user-agent'],
              ]
            );
          }
        }
      } catch (error) {
        console.error('Erro ao registrar auditoria:', error);
      }

      return originalJson(data);
    };

    next();
  };
};

module.exports = auditLog;