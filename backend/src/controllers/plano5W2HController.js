const pool = require('../config/database');
const Joi = require('joi');

// Schema de validação para plano 5W2H
const plano5W2HSchema = Joi.object({
  avaliacao_id: Joi.string().uuid().allow(null),
  titulo: Joi.string().max(255).required(),
  what: Joi.string().required(),
  why: Joi.string().required(),
  who: Joi.string().max(255).required(),
  when_date: Joi.date().required(),
  where_location: Joi.string().max(255).required(),
  how: Joi.string().required(),
  how_much: Joi.string().max(100).required(),
  prioridade: Joi.string().valid('baixa', 'media', 'alta').required(),
  status: Joi.string().valid('pendente', 'andamento', 'concluido', 'cancelado').default('pendente'),
  progresso: Joi.number().min(0).max(100).default(0),
});

const plano5W2HController = {
  // Listar planos 5W2H
  async listar(req, res) {
    try {
      const { page = 1, limit = 20, search = '', status, prioridade } = req.query;
      const offset = (page - 1) * limit;
      const empresaId = req.user.empresa_id;

      let query = `
        SELECT
          p.*,
          u.nome as criado_por_nome,
          a.id as avaliacao_id,
          a.titulo as avaliacao_titulo,
          s.nome as setor_nome
        FROM planos_5w2h p
        LEFT JOIN usuarios u ON p.criado_por = u.id
        LEFT JOIN avaliacoes_ergonomicas a ON p.avaliacao_id = a.id
        LEFT JOIN setores s ON a.setor_id = s.id
        WHERE p.empresa_id = $1
      `;

      const params = [empresaId];
      let paramIndex = 2;

      if (search) {
        query += ` AND (p.titulo ILIKE $${paramIndex} OR p.who ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (status) {
        query += ` AND p.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (prioridade) {
        query += ` AND p.prioridade = $${paramIndex}`;
        params.push(prioridade);
        paramIndex++;
      }

      // Buscar total de registros - criar query COUNT separada
      let countQuery = `
        SELECT COUNT(*) as total
        FROM planos_5w2h p
        WHERE p.empresa_id = $1
      `;
      
      const countParams = [empresaId];
      let countParamIndex = 2;
      
      if (search) {
        countQuery += ` AND (p.titulo ILIKE $${countParamIndex} OR p.who ILIKE $${countParamIndex})`;
        countParams.push(`%${search}%`);
        countParamIndex++;
      }
      
      if (status) {
        countQuery += ` AND p.status = $${countParamIndex}`;
        countParams.push(status);
        countParamIndex++;
      }
      
      if (prioridade) {
        countQuery += ` AND p.prioridade = $${countParamIndex}`;
        countParams.push(prioridade);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total || 0);

      // Adicionar ordenação e paginação
      query += ` ORDER BY p.criado_em DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      res.json({
        planos: result.rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Erro ao listar planos 5W2H:', error);
      res.status(500).json({ error: 'Erro ao listar planos 5W2H' });
    }
  },

  // Buscar plano 5W2H por ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const empresaId = req.user.empresa_id;

      const result = await pool.query(
        `SELECT
          p.*,
          u.nome as criado_por_nome,
          a.id as avaliacao_id,
          a.titulo as avaliacao_titulo,
          s.nome as setor_nome
        FROM planos_5w2h p
        LEFT JOIN usuarios u ON p.criado_por = u.id
        LEFT JOIN avaliacoes_ergonomicas a ON p.avaliacao_id = a.id
        LEFT JOIN setores s ON a.setor_id = s.id
        WHERE p.id = $1 AND p.empresa_id = $2`,
        [id, empresaId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Plano 5W2H não encontrado' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao buscar plano 5W2H:', error);
      res.status(500).json({ error: 'Erro ao buscar plano 5W2H' });
    }
  },

  // Criar plano 5W2H
  async criar(req, res) {
    try {
      const { error, value } = plano5W2HSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const empresaId = req.user.empresa_id;
      const usuarioId = req.user.id;

      const result = await pool.query(
        `INSERT INTO planos_5w2h (
          empresa_id, avaliacao_id, titulo, what, why, who, when_date, 
          where_location, how, how_much, prioridade, status, progresso, criado_por
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          empresaId,
          value.avaliacao_id,
          value.titulo,
          value.what,
          value.why,
          value.who,
          value.when_date,
          value.where_location,
          value.how,
          value.how_much,
          value.prioridade,
          value.status,
          value.progresso,
          usuarioId,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar plano 5W2H:', error);
      res.status(500).json({ error: 'Erro ao criar plano 5W2H' });
    }
  },

  // Atualizar plano 5W2H
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const empresaId = req.user.empresa_id;

      // Verificar se o plano existe e pertence à empresa
      const checkResult = await pool.query(
        'SELECT * FROM planos_5w2h WHERE id = $1 AND empresa_id = $2',
        [id, empresaId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Plano 5W2H não encontrado' });
      }

      const { error, value } = plano5W2HSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const result = await pool.query(
        `UPDATE planos_5w2h SET
          titulo = $1, what = $2, why = $3, who = $4, when_date = $5,
          where_location = $6, how = $7, how_much = $8, prioridade = $9,
          status = $10, progresso = $11, avaliacao_id = $12
        WHERE id = $13 AND empresa_id = $14
        RETURNING *`,
        [
          value.titulo,
          value.what,
          value.why,
          value.who,
          value.when_date,
          value.where_location,
          value.how,
          value.how_much,
          value.prioridade,
          value.status,
          value.progresso,
          value.avaliacao_id,
          id,
          empresaId,
        ]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao atualizar plano 5W2H:', error);
      res.status(500).json({ error: 'Erro ao atualizar plano 5W2H' });
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
        `UPDATE planos_5w2h SET progresso = $1, status = $2
        WHERE id = $3 AND empresa_id = $4
        RETURNING *`,
        [progresso, status, id, empresaId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Plano 5W2H não encontrado' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      res.status(500).json({ error: 'Erro ao atualizar progresso' });
    }
  },

  // Excluir plano 5W2H
  async excluir(req, res) {
    try {
      const { id } = req.params;
      const empresaId = req.user.empresa_id;

      const result = await pool.query(
        'DELETE FROM planos_5w2h WHERE id = $1 AND empresa_id = $2 RETURNING *',
        [id, empresaId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Plano 5W2H não encontrado' });
      }

      res.json({ message: 'Plano 5W2H excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir plano 5W2H:', error);
      res.status(500).json({ error: 'Erro ao excluir plano 5W2H' });
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
          ROUND(AVG(progresso), 2) as progresso_medio
        FROM planos_5w2h
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

module.exports = plano5W2HController;
