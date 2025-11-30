const pool = require('../config/database');
const Joi = require('joi');

// Schema de validação
const unidadeSchema = Joi.object({
  empresa_id: Joi.string().uuid().required(),
  nome: Joi.string().required().min(2).max(255),
  endereco: Joi.string().allow('', null),
});

const unidadeController = {
  // Listar unidades
  async listar(req, res) {
    try {
      const { page = 1, limit = 50, search = '', empresa_id } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          u.*,
          e.razao_social,
          e.nome_fantasia,
          COUNT(DISTINCT s.id) as total_setores,
          COUNT(DISTINCT t.id) as total_trabalhadores
        FROM unidades u
        JOIN empresas e ON u.empresa_id = e.id
        LEFT JOIN setores s ON u.id = s.unidade_id AND s.ativo = true
        LEFT JOIN trabalhadores t ON s.id = t.setor_id AND t.ativo = true
      `;

      const params = [];
      const conditions = [];

      // Se não for admin, só vê unidades da sua empresa
      if (req.user.perfil !== 'administrador') {
        conditions.push(`u.empresa_id = $${params.length + 1}`);
        params.push(req.user.empresa_id);
      } else if (empresa_id) {
        conditions.push(`u.empresa_id = $${params.length + 1}`);
        params.push(empresa_id);
      }

      // Busca
      if (search) {
        conditions.push(`(u.nome ILIKE $${params.length + 1} OR u.endereco ILIKE $${params.length + 1})`);
        params.push(`%${search}%`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` GROUP BY u.id, e.razao_social, e.nome_fantasia ORDER BY u.created_at DESC`;

      // Contar total
      const countQuery = `SELECT COUNT(DISTINCT u.id) as total FROM unidades u ${
        conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
      }`;
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
      console.error('Erro ao listar unidades:', error);
      return res.status(500).json({ error: 'Erro ao listar unidades' });
    }
  },

  // Buscar unidade por ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;

      let query = `
        SELECT 
          u.*,
          e.razao_social,
          e.nome_fantasia,
          COUNT(DISTINCT s.id) as total_setores
        FROM unidades u
        JOIN empresas e ON u.empresa_id = e.id
        LEFT JOIN setores s ON u.id = s.unidade_id AND s.ativo = true
        WHERE u.id = $1
      `;

      const params = [id];

      if (req.user.perfil !== 'administrador') {
        query += ` AND u.empresa_id = $2`;
        params.push(req.user.empresa_id);
      }

      query += ` GROUP BY u.id, e.razao_social, e.nome_fantasia`;

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Unidade não encontrada' });
      }

      return res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Erro ao buscar unidade:', error);
      return res.status(500).json({ error: 'Erro ao buscar unidade' });
    }
  },

  // Criar unidade
  async criar(req, res) {
    try {
      const { error, value } = unidadeSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: error.details.map(d => d.message) 
        });
      }

      const { empresa_id, nome, endereco } = value;

      // Verificar permissão
      if (req.user.perfil !== 'administrador' && req.user.empresa_id !== empresa_id) {
        return res.status(403).json({ error: 'Sem permissão para criar unidade em outra empresa' });
      }

      // Verificar se empresa existe
      const empresaCheck = await pool.query(
        'SELECT id FROM empresas WHERE id = $1 AND ativo = true',
        [empresa_id]
      );

      if (empresaCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Empresa não encontrada ou inativa' });
      }

      const result = await pool.query(
        `INSERT INTO unidades (empresa_id, nome, endereco)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [empresa_id, nome, endereco]
      );

      return res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Unidade criada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao criar unidade:', error);
      return res.status(500).json({ error: 'Erro ao criar unidade' });
    }
  },

  // Atualizar unidade
  async atualizar(req, res) {
    try {
      const { id } = req.params;

      // Verificar permissão
      const unidadeCheck = await pool.query(
        'SELECT empresa_id FROM unidades WHERE id = $1',
        [id]
      );

      if (unidadeCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Unidade não encontrada' });
      }

      if (req.user.perfil !== 'administrador' && req.user.empresa_id !== unidadeCheck.rows[0].empresa_id) {
        return res.status(403).json({ error: 'Sem permissão para atualizar esta unidade' });
      }

      const { nome, endereco } = req.body;

      const result = await pool.query(
        `UPDATE unidades 
         SET nome = $1, endereco = $2
         WHERE id = $3
         RETURNING *`,
        [nome, endereco, id]
      );

      return res.json({
        success: true,
        data: result.rows[0],
        message: 'Unidade atualizada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao atualizar unidade:', error);
      return res.status(500).json({ error: 'Erro ao atualizar unidade' });
    }
  },

  // Desativar unidade
  async desativar(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'UPDATE unidades SET ativo = false WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Unidade não encontrada' });
      }

      return res.json({
        success: true,
        message: 'Unidade desativada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao desativar unidade:', error);
      return res.status(500).json({ error: 'Erro ao desativar unidade' });
    }
  },

  // Reativar unidade
  async reativar(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'UPDATE unidades SET ativo = true WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Unidade não encontrada' });
      }

      return res.json({
        success: true,
        message: 'Unidade reativada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao reativar unidade:', error);
      return res.status(500).json({ error: 'Erro ao reativar unidade' });
    }
  },

  // Deletar unidade
  async deletar(req, res) {
    try {
      const { id } = req.params;

      // Verificar se tem setores
      const setoresCheck = await pool.query(
        'SELECT COUNT(*) as total FROM setores WHERE unidade_id = $1',
        [id]
      );

      if (parseInt(setoresCheck.rows[0].total) > 0) {
        return res.status(400).json({ 
          error: 'Não é possível deletar unidade com setores cadastrados' 
        });
      }

      const result = await pool.query(
        'DELETE FROM unidades WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Unidade não encontrada' });
      }

      return res.json({
        success: true,
        message: 'Unidade deletada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao deletar unidade:', error);
      return res.status(500).json({ error: 'Erro ao deletar unidade' });
    }
  },
};

module.exports = unidadeController;