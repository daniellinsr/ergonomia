const pool = require('../config/database');
const Joi = require('joi');

// Schema de validação
const trabalhadorSchema = Joi.object({
  empresa_id: Joi.string().uuid().required(),
  setor_id: Joi.string().uuid().allow('', null),
  nome: Joi.string().required().min(3).max(255),
  cpf: Joi.string().allow('', null).pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/),
  data_nascimento: Joi.date().allow('', null),
  cargo: Joi.string().allow('', null).max(255),
  funcao: Joi.string().allow('', null).max(255),
});

const trabalhadorController = {
  // Listar trabalhadores
  async listar(req, res) {
    try {
      const { page = 1, limit = 50, search = '', empresa_id, setor_id } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          t.*,
          e.razao_social,
          e.nome_fantasia,
          s.nome as setor_nome,
          u.nome as unidade_nome
        FROM trabalhadores t
        JOIN empresas e ON t.empresa_id = e.id
        LEFT JOIN setores s ON t.setor_id = s.id
        LEFT JOIN unidades u ON s.unidade_id = u.id
      `;

      const params = [];
      const conditions = [];

      // Se não for admin, só vê trabalhadores da sua empresa
      if (req.user.perfil !== 'administrador') {
        conditions.push(`t.empresa_id = $${params.length + 1}`);
        params.push(req.user.empresa_id);
      } else if (empresa_id) {
        conditions.push(`t.empresa_id = $${params.length + 1}`);
        params.push(empresa_id);
      }

      // Filtro por setor
      if (setor_id) {
        conditions.push(`t.setor_id = $${params.length + 1}`);
        params.push(setor_id);
      }

      // Busca
      if (search) {
        conditions.push(`(
          t.nome ILIKE $${params.length + 1} OR 
          t.cpf ILIKE $${params.length + 1} OR 
          t.cargo ILIKE $${params.length + 1} OR 
          t.funcao ILIKE $${params.length + 1}
        )`);
        params.push(`%${search}%`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY t.created_at DESC`;

      // Contar total
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM trabalhadores t 
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
      console.error('Erro ao listar trabalhadores:', error);
      return res.status(500).json({ error: 'Erro ao listar trabalhadores' });
    }
  },

  // Buscar trabalhador por ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;

      let query = `
        SELECT 
          t.*,
          e.razao_social,
          e.nome_fantasia,
          s.nome as setor_nome,
          u.nome as unidade_nome
        FROM trabalhadores t
        JOIN empresas e ON t.empresa_id = e.id
        LEFT JOIN setores s ON t.setor_id = s.id
        LEFT JOIN unidades u ON s.unidade_id = u.id
        WHERE t.id = $1
      `;

      const params = [id];

      if (req.user.perfil !== 'administrador') {
        query += ` AND t.empresa_id = $2`;
        params.push(req.user.empresa_id);
      }

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Trabalhador não encontrado' });
      }

      return res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Erro ao buscar trabalhador:', error);
      return res.status(500).json({ error: 'Erro ao buscar trabalhador' });
    }
  },

  // Criar trabalhador
  async criar(req, res) {
    try {
      const { error, value } = trabalhadorSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: error.details.map(d => d.message) 
        });
      }

      const { empresa_id, setor_id, nome, cpf, data_nascimento, cargo, funcao } = value;

      // Verificar permissão
      if (req.user.perfil !== 'administrador' && req.user.empresa_id !== empresa_id) {
        return res.status(403).json({ error: 'Sem permissão para criar trabalhador em outra empresa' });
      }

      // Verificar se empresa existe
      const empresaCheck = await pool.query(
        'SELECT id FROM empresas WHERE id = $1 AND ativo = true',
        [empresa_id]
      );

      if (empresaCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Empresa não encontrada ou inativa' });
      }

      // Verificar se setor existe (se fornecido)
      if (setor_id) {
        const setorCheck = await pool.query(
          'SELECT id FROM setores WHERE id = $1 AND ativo = true',
          [setor_id]
        );

        if (setorCheck.rows.length === 0) {
          return res.status(400).json({ error: 'Setor não encontrado ou inativo' });
        }
      }

      // Verificar se CPF já existe (se fornecido)
      if (cpf) {
        const cpfCheck = await pool.query(
          'SELECT id FROM trabalhadores WHERE cpf = $1',
          [cpf]
        );

        if (cpfCheck.rows.length > 0) {
          return res.status(400).json({ error: 'CPF já cadastrado' });
        }
      }

      const result = await pool.query(
        `INSERT INTO trabalhadores (empresa_id, setor_id, nome, cpf, data_nascimento, cargo, funcao)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [empresa_id, setor_id || null, nome, cpf || null, data_nascimento || null, cargo, funcao]
      );

      return res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Trabalhador cadastrado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao criar trabalhador:', error);
      return res.status(500).json({ error: 'Erro ao criar trabalhador' });
    }
  },

  // Atualizar trabalhador
  async atualizar(req, res) {
    try {
      const { id } = req.params;

      // Verificar permissão
      const trabalhadorCheck = await pool.query(
        'SELECT empresa_id FROM trabalhadores WHERE id = $1',
        [id]
      );

      if (trabalhadorCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Trabalhador não encontrado' });
      }

      if (req.user.perfil !== 'administrador' && req.user.empresa_id !== trabalhadorCheck.rows[0].empresa_id) {
        return res.status(403).json({ error: 'Sem permissão para atualizar este trabalhador' });
      }

      const { setor_id, nome, cpf, data_nascimento, cargo, funcao } = req.body;

      // Verificar CPF duplicado (se fornecido)
      if (cpf) {
        const cpfCheck = await pool.query(
          'SELECT id FROM trabalhadores WHERE cpf = $1 AND id != $2',
          [cpf, id]
        );

        if (cpfCheck.rows.length > 0) {
          return res.status(400).json({ error: 'CPF já cadastrado' });
        }
      }

      const result = await pool.query(
        `UPDATE trabalhadores 
         SET setor_id = $1, nome = $2, cpf = $3, data_nascimento = $4, cargo = $5, funcao = $6
         WHERE id = $7
         RETURNING *`,
        [setor_id || null, nome, cpf || null, data_nascimento || null, cargo, funcao, id]
      );

      return res.json({
        success: true,
        data: result.rows[0],
        message: 'Trabalhador atualizado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao atualizar trabalhador:', error);
      return res.status(500).json({ error: 'Erro ao atualizar trabalhador' });
    }
  },

  // Desativar trabalhador
  async desativar(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'UPDATE trabalhadores SET ativo = false WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Trabalhador não encontrado' });
      }

      return res.json({
        success: true,
        message: 'Trabalhador desativado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao desativar trabalhador:', error);
      return res.status(500).json({ error: 'Erro ao desativar trabalhador' });
    }
  },

  // Reativar trabalhador
  async reativar(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'UPDATE trabalhadores SET ativo = true WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Trabalhador não encontrado' });
      }

      return res.json({
        success: true,
        message: 'Trabalhador reativado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao reativar trabalhador:', error);
      return res.status(500).json({ error: 'Erro ao reativar trabalhador' });
    }
  },

  // Deletar trabalhador
  async deletar(req, res) {
    try {
      const { id } = req.params;

      // Verificar se tem avaliações
      const avaliacoesCheck = await pool.query(
        'SELECT COUNT(*) as total FROM avaliacoes_ergonomicas WHERE trabalhador_id = $1',
        [id]
      );

      if (parseInt(avaliacoesCheck.rows[0].total) > 0) {
        return res.status(400).json({ 
          error: 'Não é possível deletar trabalhador com avaliações cadastradas' 
        });
      }

      const result = await pool.query(
        'DELETE FROM trabalhadores WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Trabalhador não encontrado' });
      }

      return res.json({
        success: true,
        message: 'Trabalhador deletado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao deletar trabalhador:', error);
      return res.status(500).json({ error: 'Erro ao deletar trabalhador' });
    }
  },
};

module.exports = trabalhadorController;