const pool = require('../config/database');
const Joi = require('joi');

// Schema de validação para ação corretiva
const acaoCorretivaSchema = Joi.object({
  avaliacao_id: Joi.string().uuid().allow(null),
  titulo: Joi.string().max(255).required(),
  descricao_problema: Joi.string().required(),
  causa_raiz: Joi.string().required(),
  acao_corretiva: Joi.string().required(),
  responsavel: Joi.string().max(255).required(),
  prazo: Joi.date().required(),
  prioridade: Joi.string().valid('baixa', 'media', 'alta').required(),
  categoria: Joi.string().valid('ergonomia', 'equipamento', 'processo', 'treinamento', 'organizacao').required(),
  status: Joi.string().valid('pendente', 'andamento', 'concluido', 'cancelado').default('pendente'),
  progresso: Joi.number().min(0).max(100).default(0),
});

const acaoCorretivaController = {
  // Listar ações corretivas
  async listar(req, res) {
    try {
      const { page = 1, limit = 20, search = '', status, prioridade, categoria } = req.query;
      const offset = (page - 1) * limit;
      const empresaId = req.user.empresa_id;

      let query = `
        SELECT
          ac.*,
          u.nome as criado_por_nome,
          a.id as avaliacao_id,
          a.titulo as avaliacao_titulo,
          s.nome as setor_nome
        FROM acoes_corretivas ac
        LEFT JOIN usuarios u ON ac.criado_por = u.id
        LEFT JOIN avaliacoes_ergonomicas a ON ac.avaliacao_id = a.id
        LEFT JOIN setores s ON a.setor_id = s.id
        WHERE ac.empresa_id = $1
      `;

      const params = [empresaId];
      let paramIndex = 2;

      if (search) {
        query += ` AND (ac.titulo ILIKE $${paramIndex} OR ac.responsavel ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (status) {
        query += ` AND ac.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (prioridade) {
        query += ` AND ac.prioridade = $${paramIndex}`;
        params.push(prioridade);
        paramIndex++;
      }

      if (categoria) {
        query += ` AND ac.categoria = $${paramIndex}`;
        params.push(categoria);
        paramIndex++;
      }

      // Buscar total de registros - criar query COUNT separada
      let countQuery = `
        SELECT COUNT(*) as total
        FROM acoes_corretivas ac
        WHERE ac.empresa_id = $1
      `;
      
      const countParams = [empresaId];
      let countParamIndex = 2;
      
      if (search) {
        countQuery += ` AND (ac.titulo ILIKE $${countParamIndex} OR ac.responsavel ILIKE $${countParamIndex})`;
        countParams.push(`%${search}%`);
        countParamIndex++;
      }
      
      if (status) {
        countQuery += ` AND ac.status = $${countParamIndex}`;
        countParams.push(status);
        countParamIndex++;
      }
      
      if (prioridade) {
        countQuery += ` AND ac.prioridade = $${countParamIndex}`;
        countParams.push(prioridade);
        countParamIndex++;
      }
      
      if (categoria) {
        countQuery += ` AND ac.categoria = $${countParamIndex}`;
        countParams.push(categoria);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total || 0);

      // Adicionar ordenação e paginação
      query += ` ORDER BY ac.criado_em DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      res.json({
        acoes: result.rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Erro ao listar ações corretivas:', error);
      res.status(500).json({ error: 'Erro ao listar ações corretivas' });
    }
  },

  // Buscar ação corretiva por ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const empresaId = req.user.empresa_id;

      const result = await pool.query(
        `SELECT
          ac.*,
          u.nome as criado_por_nome,
          a.id as avaliacao_id,
          a.titulo as avaliacao_titulo,
          s.nome as setor_nome
        FROM acoes_corretivas ac
        LEFT JOIN usuarios u ON ac.criado_por = u.id
        LEFT JOIN avaliacoes_ergonomicas a ON ac.avaliacao_id = a.id
        LEFT JOIN setores s ON a.setor_id = s.id
        WHERE ac.id = $1 AND ac.empresa_id = $2`,
        [id, empresaId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Ação corretiva não encontrada' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao buscar ação corretiva:', error);
      res.status(500).json({ error: 'Erro ao buscar ação corretiva' });
    }
  },

  // Criar ação corretiva
  async criar(req, res) {
    try {
      const { error, value } = acaoCorretivaSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const empresaId = req.user.empresa_id;
      const usuarioId = req.user.id;

      const result = await pool.query(
        `INSERT INTO acoes_corretivas (
          empresa_id, avaliacao_id, titulo, descricao_problema, causa_raiz,
          acao_corretiva, responsavel, prazo, prioridade, categoria,
          status, progresso, criado_por
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          empresaId,
          value.avaliacao_id,
          value.titulo,
          value.descricao_problema,
          value.causa_raiz,
          value.acao_corretiva,
          value.responsavel,
          value.prazo,
          value.prioridade,
          value.categoria,
          value.status,
          value.progresso,
          usuarioId,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar ação corretiva:', error);
      res.status(500).json({ error: 'Erro ao criar ação corretiva' });
    }
  },

  // Atualizar ação corretiva
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const empresaId = req.user.empresa_id;

      // Verificar se a ação existe e pertence à empresa
      const checkResult = await pool.query(
        'SELECT * FROM acoes_corretivas WHERE id = $1 AND empresa_id = $2',
        [id, empresaId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Ação corretiva não encontrada' });
      }

      const { error, value } = acaoCorretivaSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const result = await pool.query(
        `UPDATE acoes_corretivas SET
          titulo = $1, descricao_problema = $2, causa_raiz = $3,
          acao_corretiva = $4, responsavel = $5, prazo = $6,
          prioridade = $7, categoria = $8, status = $9,
          progresso = $10, avaliacao_id = $11
        WHERE id = $12 AND empresa_id = $13
        RETURNING *`,
        [
          value.titulo,
          value.descricao_problema,
          value.causa_raiz,
          value.acao_corretiva,
          value.responsavel,
          value.prazo,
          value.prioridade,
          value.categoria,
          value.status,
          value.progresso,
          value.avaliacao_id,
          id,
          empresaId,
        ]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao atualizar ação corretiva:', error);
      res.status(500).json({ error: 'Erro ao atualizar ação corretiva' });
    }
  },

  // Atualizar status e progresso
  async atualizarProgresso(req, res) {
    try {
      const { id } = req.params;
      const { progresso } = req.body;
      const empresaId = req.user.empresa_id;

      if (progresso === undefined || progresso < 0 || progresso > 100) {
        return res.status(400).json({ error: 'Progresso deve estar entre 0 e 100' });
      }

      // Calcular status automaticamente
      let status;
      if (progresso === 0) {
        status = 'pendente';
      } else if (progresso === 100) {
        status = 'concluido';
      } else {
        status = 'andamento';
      }

      const result = await pool.query(
        `UPDATE acoes_corretivas SET progresso = $1, status = $2
        WHERE id = $3 AND empresa_id = $4
        RETURNING *`,
        [progresso, status, id, empresaId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Ação corretiva não encontrada' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      res.status(500).json({ error: 'Erro ao atualizar progresso' });
    }
  },

  // Excluir ação corretiva
  async excluir(req, res) {
    try {
      const { id } = req.params;
      const empresaId = req.user.empresa_id;

      const result = await pool.query(
        'DELETE FROM acoes_corretivas WHERE id = $1 AND empresa_id = $2 RETURNING *',
        [id, empresaId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Ação corretiva não encontrada' });
      }

      res.json({ message: 'Ação corretiva excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir ação corretiva:', error);
      res.status(500).json({ error: 'Erro ao excluir ação corretiva' });
    }
  },

  // Estatísticas
  async estatisticas(req, res) {
    try {
      const empresaId = req.user.empresa_id;

      const result = await pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'pendente') as pendentes,
          COUNT(*) FILTER (WHERE status = 'andamento') as em_andamento,
          COUNT(*) FILTER (WHERE status = 'concluido') as concluidos,
          COUNT(*) FILTER (WHERE status = 'cancelado') as cancelados,
          COUNT(*) FILTER (WHERE prioridade = 'alta') as alta_prioridade,
          COUNT(*) FILTER (WHERE prioridade = 'media') as media_prioridade,
          COUNT(*) FILTER (WHERE prioridade = 'baixa') as baixa_prioridade,
          COUNT(*) FILTER (WHERE categoria = 'ergonomia') as cat_ergonomia,
          COUNT(*) FILTER (WHERE categoria = 'equipamento') as cat_equipamento,
          COUNT(*) FILTER (WHERE categoria = 'processo') as cat_processo,
          COUNT(*) FILTER (WHERE categoria = 'treinamento') as cat_treinamento,
          COUNT(*) FILTER (WHERE categoria = 'organizacao') as cat_organizacao,
          ROUND(AVG(progresso), 2) as progresso_medio
        FROM acoes_corretivas
        WHERE empresa_id = $1`,
        [empresaId]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  },
};

module.exports = acaoCorretivaController;
