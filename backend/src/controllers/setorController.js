const pool = require('../config/database');
const Joi = require('joi');

// Schema de validação
const setorSchema = Joi.object({
  unidade_id: Joi.string().uuid().required(),
  nome: Joi.string().required().min(2).max(255),
  descricao: Joi.string().allow('', null),
});

const setorController = {
  // Listar setores
  async listar(req, res) {
    try {
      const { page = 1, limit = 50, search = '', unidade_id, empresa_id } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT
          s.*,
          u.nome as unidade_nome,
          u.empresa_id,
          e.razao_social,
          e.nome_fantasia,
          COUNT(DISTINCT a.id) as total_avaliacoes
        FROM setores s
        JOIN unidades u ON s.unidade_id = u.id
        JOIN empresas e ON u.empresa_id = e.id
        LEFT JOIN avaliacoes_ergonomicas a ON s.id = a.setor_id
      `;

      const params = [];
      const conditions = [];

      // Filtros
      if (req.user.perfil !== 'administrador') {
        conditions.push(`u.empresa_id = $${params.length + 1}`);
        params.push(req.user.empresa_id);
      } else if (empresa_id) {
        conditions.push(`u.empresa_id = $${params.length + 1}`);
        params.push(empresa_id);
      }

      if (unidade_id) {
        conditions.push(`s.unidade_id = $${params.length + 1}`);
        params.push(unidade_id);
      }

      if (search) {
        conditions.push(`(s.nome ILIKE $${params.length + 1} OR s.descricao ILIKE $${params.length + 1})`);
        params.push(`%${search}%`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` GROUP BY s.id, u.nome, u.empresa_id, e.razao_social, e.nome_fantasia ORDER BY s.created_at DESC`;

      // Contar total
      const countQuery = `
        SELECT COUNT(DISTINCT s.id) as total 
        FROM setores s 
        JOIN unidades u ON s.unidade_id = u.id
        ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
      `;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Buscar dados paginados
      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      return res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Erro ao listar setores:', error);
      return res.status(500).json({ error: 'Erro ao listar setores' });
    }
  },

  // Criar setor
  async criar(req, res) {
    try {
      const { error, value } = setorSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: error.details.map(d => d.message) 
        });
      }

      const { unidade_id, nome, descricao } = value;

      // Verificar se unidade existe e se tem permissão
      const unidadeCheck = await pool.query(
        'SELECT empresa_id FROM unidades WHERE id = $1 AND ativo = true',
        [unidade_id]
      );

      if (unidadeCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Unidade não encontrada ou inativa' });
      }

      if (req.user.perfil !== 'administrador' && req.user.empresa_id !== unidadeCheck.rows[0].empresa_id) {
        return res.status(403).json({ error: 'Sem permissão para criar setor nesta unidade' });
      }

      const empresa_id = unidadeCheck.rows[0].empresa_id;

      const result = await pool.query(
        `INSERT INTO setores (empresa_id, unidade_id, nome, descricao)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [empresa_id, unidade_id, nome, descricao]
      );

      return res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Setor criado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao criar setor:', error);
      return res.status(500).json({ error: 'Erro ao criar setor' });
    }
  },

  // Atualizar setor
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, descricao } = req.body;

      const result = await pool.query(
        `UPDATE setores 
         SET nome = $1, descricao = $2
         WHERE id = $3
         RETURNING *`,
        [nome, descricao, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Setor não encontrado' });
      }

      return res.json({
        success: true,
        data: result.rows[0],
        message: 'Setor atualizado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao atualizar setor:', error);
      return res.status(500).json({ error: 'Erro ao atualizar setor' });
    }
  },

  // Desativar setor
  async desativar(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'UPDATE setores SET ativo = false WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Setor não encontrado' });
      }

      return res.json({
        success: true,
        message: 'Setor desativado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao desativar setor:', error);
      return res.status(500).json({ error: 'Erro ao desativar setor' });
    }
  },

  // Reativar setor
  async reativar(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'UPDATE setores SET ativo = true WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Setor não encontrado' });
      }

      return res.json({
        success: true,
        message: 'Setor reativado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao reativar setor:', error);
      return res.status(500).json({ error: 'Erro ao reativar setor' });
    }
  },

  // Deletar setor
  async deletar(req, res) {
    try {
      const { id } = req.params;

      // Verificar se tem avaliações
      const avaliacoesCheck = await pool.query(
        'SELECT COUNT(*) as total FROM avaliacoes_ergonomicas WHERE setor_id = $1',
        [id]
      );

      if (parseInt(avaliacoesCheck.rows[0].total) > 0) {
        return res.status(400).json({
          error: 'Não é possível deletar setor com avaliações cadastradas'
        });
      }

      const result = await pool.query(
        'DELETE FROM setores WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Setor não encontrado' });
      }

      return res.json({
        success: true,
        message: 'Setor deletado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao deletar setor:', error);
      return res.status(500).json({ error: 'Erro ao deletar setor' });
    }
  },
};

module.exports = setorController;