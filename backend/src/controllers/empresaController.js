const pool = require('../config/database');
const Joi = require('joi');

// Schema de validação
const empresaSchema = Joi.object({
  razao_social: Joi.string().required().min(3).max(255),
  nome_fantasia: Joi.string().allow('', null).max(255),
  cnpj: Joi.string().required().pattern(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/),
  endereco: Joi.string().allow('', null),
  telefone: Joi.string().allow('', null).max(20),
  email: Joi.string().email().allow('', null).max(255),
});

const empresaController = {
  // Listar todas as empresas (apenas admin pode ver todas)
  async listar(req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          e.*,
          COUNT(u.id) as total_usuarios
        FROM empresas e
        LEFT JOIN usuarios u ON e.id = u.empresa_id AND u.ativo = true
      `;

      const params = [];
      
      // Se não for admin, só vê sua própria empresa
      if (req.user.perfil !== 'administrador') {
        query += ` WHERE e.id = $1`;
        params.push(req.user.empresa_id);
      } else if (search) {
        query += ` WHERE (
          e.razao_social ILIKE $1 OR 
          e.nome_fantasia ILIKE $1 OR 
          e.cnpj ILIKE $1
        )`;
        params.push(`%${search}%`);
      }

      query += ` GROUP BY e.id ORDER BY e.created_at DESC`;

      // Contar total
      const countQuery = `SELECT COUNT(DISTINCT e.id) as total FROM empresas e ${
        req.user.perfil !== 'administrador' ? 'WHERE e.id = $1' : 
        search ? `WHERE (e.razao_social ILIKE $1 OR e.nome_fantasia ILIKE $1 OR e.cnpj ILIKE $1)` : ''
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
      console.error('Erro ao listar empresas:', error);
      return res.status(500).json({ error: 'Erro ao listar empresas' });
    }
  },

  // Buscar empresa por ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;

      // Se não for admin, só pode ver sua própria empresa
      let query = `
        SELECT 
          e.*,
          COUNT(DISTINCT u.id) as total_usuarios,
          COUNT(DISTINCT un.id) as total_unidades,
          COUNT(DISTINCT t.id) as total_trabalhadores
        FROM empresas e
        LEFT JOIN usuarios u ON e.id = u.empresa_id AND u.ativo = true
        LEFT JOIN unidades un ON e.id = un.empresa_id AND un.ativo = true
        LEFT JOIN trabalhadores t ON e.id = t.empresa_id AND t.ativo = true
        WHERE e.id = $1
      `;

      const params = [id];

      if (req.user.perfil !== 'administrador') {
        query += ` AND e.id = $2`;
        params.push(req.user.empresa_id);
      }

      query += ` GROUP BY e.id`;

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      return res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
      return res.status(500).json({ error: 'Erro ao buscar empresa' });
    }
  },

  // Criar nova empresa (apenas admin)
  async criar(req, res) {
    try {
      // Validar dados
      const { error, value } = empresaSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: error.details.map(d => d.message) 
        });
      }

      const { razao_social, nome_fantasia, cnpj, endereco, telefone, email } = value;

      // Verificar se CNPJ já existe
      const cnpjCheck = await pool.query(
        'SELECT id FROM empresas WHERE cnpj = $1',
        [cnpj]
      );

      if (cnpjCheck.rows.length > 0) {
        return res.status(400).json({ error: 'CNPJ já cadastrado' });
      }

      // Inserir empresa
      const result = await pool.query(
        `INSERT INTO empresas (razao_social, nome_fantasia, cnpj, endereco, telefone, email)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [razao_social, nome_fantasia, cnpj, endereco, telefone, email]
      );

      return res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Empresa criada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      return res.status(500).json({ error: 'Erro ao criar empresa' });
    }
  },

  // Atualizar empresa
  async atualizar(req, res) {
    try {
      const { id } = req.params;

      // Verificar permissão
      if (req.user.perfil !== 'administrador' && req.user.empresa_id !== id) {
        return res.status(403).json({ error: 'Sem permissão para atualizar esta empresa' });
      }

      // Validar dados
      const { error, value } = empresaSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: error.details.map(d => d.message) 
        });
      }

      const { razao_social, nome_fantasia, cnpj, endereco, telefone, email } = value;

      // Verificar se CNPJ já existe em outra empresa
      const cnpjCheck = await pool.query(
        'SELECT id FROM empresas WHERE cnpj = $1 AND id != $2',
        [cnpj, id]
      );

      if (cnpjCheck.rows.length > 0) {
        return res.status(400).json({ error: 'CNPJ já cadastrado em outra empresa' });
      }

      // Atualizar empresa
      const result = await pool.query(
        `UPDATE empresas 
         SET razao_social = $1, nome_fantasia = $2, cnpj = $3, 
             endereco = $4, telefone = $5, email = $6
         WHERE id = $7
         RETURNING *`,
        [razao_social, nome_fantasia, cnpj, endereco, telefone, email, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      return res.json({
        success: true,
        data: result.rows[0],
        message: 'Empresa atualizada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      return res.status(500).json({ error: 'Erro ao atualizar empresa' });
    }
  },

  // Desativar empresa (soft delete)
  async desativar(req, res) {
    try {
      const { id } = req.params;

      // Verificar se não é a própria empresa do usuário
      if (req.user.empresa_id === id) {
        return res.status(400).json({ 
          error: 'Não é possível desativar sua própria empresa' 
        });
      }

      const result = await pool.query(
        `UPDATE empresas 
         SET ativo = false
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      return res.json({
        success: true,
        message: 'Empresa desativada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao desativar empresa:', error);
      return res.status(500).json({ error: 'Erro ao desativar empresa' });
    }
  },

  // Reativar empresa
  async reativar(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `UPDATE empresas 
         SET ativo = true
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      return res.json({
        success: true,
        message: 'Empresa reativada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao reativar empresa:', error);
      return res.status(500).json({ error: 'Erro ao reativar empresa' });
    }
  },

  // Deletar empresa permanentemente (apenas admin)
  async deletar(req, res) {
    try {
      const { id } = req.params;

      // Verificar se não é a própria empresa do usuário
      if (req.user.empresa_id === id) {
        return res.status(400).json({ 
          error: 'Não é possível deletar sua própria empresa' 
        });
      }

      // Verificar se tem usuários ativos
      const usuariosCheck = await pool.query(
        'SELECT COUNT(*) as total FROM usuarios WHERE empresa_id = $1 AND ativo = true',
        [id]
      );

      if (parseInt(usuariosCheck.rows[0].total) > 0) {
        return res.status(400).json({ 
          error: 'Não é possível deletar empresa com usuários ativos' 
        });
      }

      const result = await pool.query(
        'DELETE FROM empresas WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      return res.json({
        success: true,
        message: 'Empresa deletada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao deletar empresa:', error);
      return res.status(500).json({ error: 'Erro ao deletar empresa' });
    }
  },
};

module.exports = empresaController;