const pool = require('../config/database');
const Joi = require('joi');

// Schema de validação para ciclo PDCA
const cicloPDCASchema = Joi.object({
  avaliacao_id: Joi.string().uuid().allow(null),
  titulo: Joi.string().max(255).required(),
  plan: Joi.string().required(),
  doo: Joi.string().required(),
  check_phase: Joi.string().required(),
  act: Joi.string().required(),
  responsavel: Joi.string().max(255).required(),
  data_inicio: Joi.date().required(),
  data_conclusao: Joi.date().allow(null),
  fase_atual: Joi.string().valid('plan', 'do', 'check', 'act').default('plan'),
  status: Joi.string().valid('pendente', 'andamento', 'concluido', 'cancelado').default('andamento'),
  progresso: Joi.number().min(0).max(100).default(25),
});

const cicloPDCAController = {
  // Listar ciclos PDCA
  async listar(req, res) {
    try {
      const { page = 1, limit = 20, search = '', status, fase } = req.query;
      const offset = (page - 1) * limit;
      const empresaId = req.user.empresa_id;

      let query = `
        SELECT
          p.*,
          u.nome as criado_por_nome,
          a.id as avaliacao_id,
          a.titulo as avaliacao_titulo,
          s.nome as setor_nome
        FROM ciclos_pdca p
        LEFT JOIN usuarios u ON p.criado_por = u.id
        LEFT JOIN avaliacoes_ergonomicas a ON p.avaliacao_id = a.id
        LEFT JOIN setores s ON a.setor_id = s.id
        WHERE p.empresa_id = $1
      `;

      const params = [empresaId];
      let paramIndex = 2;

      if (search) {
        query += ` AND (p.titulo ILIKE $${paramIndex} OR p.responsavel ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (status) {
        query += ` AND p.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (fase) {
        query += ` AND p.fase_atual = $${paramIndex}`;
        params.push(fase);
        paramIndex++;
      }

      // Buscar total de registros
      // Buscar total de registros - criar query COUNT separada
      let countQuery = `
        SELECT COUNT(*) as total
        FROM ciclos_pdca p
        WHERE p.empresa_id = $1
      `;
      
      const countParams = [empresaId];
      let countParamIndex = 2;
      
      if (search) {
        countQuery += ` AND (p.titulo ILIKE $${countParamIndex} OR p.responsavel ILIKE $${countParamIndex})`;
        countParams.push(`%${search}%`);
        countParamIndex++;
      }
      
      if (status) {
        countQuery += ` AND p.status = $${countParamIndex}`;
        countParams.push(status);
        countParamIndex++;
      }
      
      if (fase) {
        countQuery += ` AND p.fase_atual = $${countParamIndex}`;
        countParams.push(fase);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total || 0);

      // Adicionar ordenação e paginação
      query += ` ORDER BY p.criado_em DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      res.json({
        ciclos: result.rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Erro ao listar ciclos PDCA:', error);
      res.status(500).json({ error: 'Erro ao listar ciclos PDCA' });
    }
  },

  // Buscar ciclo PDCA por ID
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
        FROM ciclos_pdca p
        LEFT JOIN usuarios u ON p.criado_por = u.id
        LEFT JOIN avaliacoes_ergonomicas a ON p.avaliacao_id = a.id
        LEFT JOIN setores s ON a.setor_id = s.id
        WHERE p.id = $1 AND p.empresa_id = $2`,
        [id, empresaId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Ciclo PDCA não encontrado' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao buscar ciclo PDCA:', error);
      res.status(500).json({ error: 'Erro ao buscar ciclo PDCA' });
    }
  },

  // Criar ciclo PDCA
  async criar(req, res) {
    try {
      const { error, value } = cicloPDCASchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const empresaId = req.user.empresa_id;
      const usuarioId = req.user.id;

      const result = await pool.query(
        `INSERT INTO ciclos_pdca (
          empresa_id, avaliacao_id, titulo, plan, doo, check_phase, act,
          responsavel, data_inicio, data_conclusao, fase_atual, status, progresso, criado_por
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          empresaId,
          value.avaliacao_id,
          value.titulo,
          value.plan,
          value.doo,
          value.check_phase,
          value.act,
          value.responsavel,
          value.data_inicio,
          value.data_conclusao,
          value.fase_atual,
          value.status,
          value.progresso,
          usuarioId,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar ciclo PDCA:', error);
      res.status(500).json({ error: 'Erro ao criar ciclo PDCA' });
    }
  },

  // Atualizar ciclo PDCA
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const empresaId = req.user.empresa_id;

      // Verificar se o ciclo existe e pertence à empresa
      const checkResult = await pool.query(
        'SELECT * FROM ciclos_pdca WHERE id = $1 AND empresa_id = $2',
        [id, empresaId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Ciclo PDCA não encontrado' });
      }

      const { error, value } = cicloPDCASchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const result = await pool.query(
        `UPDATE ciclos_pdca SET
          titulo = $1, plan = $2, doo = $3, check_phase = $4, act = $5,
          responsavel = $6, data_inicio = $7, data_conclusao = $8,
          fase_atual = $9, status = $10, progresso = $11, avaliacao_id = $12
        WHERE id = $13 AND empresa_id = $14
        RETURNING *`,
        [
          value.titulo,
          value.plan,
          value.doo,
          value.check_phase,
          value.act,
          value.responsavel,
          value.data_inicio,
          value.data_conclusao,
          value.fase_atual,
          value.status,
          value.progresso,
          value.avaliacao_id,
          id,
          empresaId,
        ]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao atualizar ciclo PDCA:', error);
      res.status(500).json({ error: 'Erro ao atualizar ciclo PDCA' });
    }
  },

  // Avançar fase do PDCA
  async avancarFase(req, res) {
    try {
      const { id } = req.params;
      const empresaId = req.user.empresa_id;

      const currentResult = await pool.query(
        'SELECT fase_atual, progresso FROM ciclos_pdca WHERE id = $1 AND empresa_id = $2',
        [id, empresaId]
      );

      if (currentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Ciclo PDCA não encontrado' });
      }

      const { fase_atual } = currentResult.rows[0];
      const fases = ['plan', 'do', 'check', 'act'];
      const faseAtualIndex = fases.indexOf(fase_atual);

      if (faseAtualIndex === -1 || faseAtualIndex >= fases.length - 1) {
        return res.status(400).json({ error: 'Ciclo já está na última fase' });
      }

      const novaFase = fases[faseAtualIndex + 1];
      const novoProgresso = ((faseAtualIndex + 2) / 4) * 100;

      const result = await pool.query(
        `UPDATE ciclos_pdca SET fase_atual = $1, progresso = $2
        WHERE id = $3 AND empresa_id = $4
        RETURNING *`,
        [novaFase, novoProgresso, id, empresaId]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao avançar fase do PDCA:', error);
      res.status(500).json({ error: 'Erro ao avançar fase do PDCA' });
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
      let data_conclusao = null;
      
      if (progresso === 0) {
        status = 'pendente';
      } else if (progresso === 100) {
        status = 'concluido';
        data_conclusao = new Date();
      } else {
        status = 'andamento';
      }

      const result = await pool.query(
        `UPDATE ciclos_pdca SET progresso = $1, status = $2, data_conclusao = $3
        WHERE id = $4 AND empresa_id = $5
        RETURNING *`,
        [progresso, status, data_conclusao, id, empresaId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Ciclo PDCA não encontrado' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      res.status(500).json({ error: 'Erro ao atualizar progresso' });
    }
  },

  // Excluir ciclo PDCA
  async excluir(req, res) {
    try {
      const { id } = req.params;
      const empresaId = req.user.empresa_id;

      const result = await pool.query(
        'DELETE FROM ciclos_pdca WHERE id = $1 AND empresa_id = $2 RETURNING *',
        [id, empresaId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Ciclo PDCA não encontrado' });
      }

      res.json({ message: 'Ciclo PDCA excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir ciclo PDCA:', error);
      res.status(500).json({ error: 'Erro ao excluir ciclo PDCA' });
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
          COUNT(*) FILTER (WHERE fase_atual = 'plan') as fase_plan,
          COUNT(*) FILTER (WHERE fase_atual = 'do') as fase_do,
          COUNT(*) FILTER (WHERE fase_atual = 'check') as fase_check,
          COUNT(*) FILTER (WHERE fase_atual = 'act') as fase_act,
          ROUND(AVG(progresso), 2) as progresso_medio
        FROM ciclos_pdca
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

module.exports = cicloPDCAController;
