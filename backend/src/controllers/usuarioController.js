const pool = require('../config/database');
const bcrypt = require('bcrypt');
const Joi = require('joi');

// Schema de validação para criar usuário
const usuarioCreateSchema = Joi.object({
  empresa_id: Joi.string().uuid().required(),
  nome: Joi.string().required().min(3).max(255),
  email: Joi.string().email().required().max(255),
  senha: Joi.string().required().min(6).max(100),
  cpf: Joi.string().allow('', null).pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/),
  tipo_profissional: Joi.string().allow('', null).max(100),
  perfil: Joi.string().valid('administrador', 'usuario').required(),
});

// Schema de validação para atualizar usuário
const usuarioUpdateSchema = Joi.object({
  nome: Joi.string().min(3).max(255),
  email: Joi.string().email().max(255),
  senha: Joi.string().min(6).max(100).allow('', null),
  cpf: Joi.string().allow('', null).pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/),
  tipo_profissional: Joi.string().allow('', null).max(100),
  perfil: Joi.string().valid('administrador', 'usuario'),
});

const usuarioController = {
  // Listar usuários
  async listar(req, res) {
    try {
      const { page = 1, limit = 10, search = '', empresa_id } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          u.id,
          u.nome,
          u.email,
          u.cpf,
          u.tipo_profissional,
          u.perfil,
          u.ativo,
          u.created_at,
          u.empresa_id,
          e.razao_social,
          e.nome_fantasia
        FROM usuarios u
        JOIN empresas e ON u.empresa_id = e.id
      `;

      const params = [];
      const conditions = [];

      // Se não for admin, só vê usuários da sua empresa
      if (req.user.perfil !== 'administrador') {
        conditions.push(`u.empresa_id = $${params.length + 1}`);
        params.push(req.user.empresa_id);
      } else if (empresa_id) {
        // Admin pode filtrar por empresa
        conditions.push(`u.empresa_id = $${params.length + 1}`);
        params.push(empresa_id);
      }

      // Busca
      if (search) {
        conditions.push(`(
          u.nome ILIKE $${params.length + 1} OR 
          u.email ILIKE $${params.length + 1} OR 
          u.cpf ILIKE $${params.length + 1}
        )`);
        params.push(`%${search}%`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY u.created_at DESC`;

      // Contar total
      const countQuery = `SELECT COUNT(*) as total FROM usuarios u ${
        conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
      }`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Buscar dados paginados
      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Remover senha_hash dos resultados
      const usuarios = result.rows.map(({ senha_hash, ...user }) => user);

      return res.json({
        success: true,
        data: usuarios,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({ error: 'Erro ao listar usuários' });
    }
  },

  // Buscar usuário por ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;

      let query = `
        SELECT 
          u.id,
          u.nome,
          u.email,
          u.cpf,
          u.tipo_profissional,
          u.perfil,
          u.ativo,
          u.created_at,
          u.empresa_id,
          e.razao_social,
          e.nome_fantasia
        FROM usuarios u
        JOIN empresas e ON u.empresa_id = e.id
        WHERE u.id = $1
      `;

      const params = [id];

      // Se não for admin, só pode ver usuários da sua empresa
      if (req.user.perfil !== 'administrador') {
        query += ` AND u.empresa_id = $2`;
        params.push(req.user.empresa_id);
      }

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
  },

  // Criar novo usuário
  async criar(req, res) {
    try {
      // Validar dados
      const { error, value } = usuarioCreateSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: error.details.map(d => d.message) 
        });
      }

      const { empresa_id, nome, email, senha, cpf, tipo_profissional, perfil } = value;

      // Verificar se pode criar usuário para esta empresa
      if (req.user.perfil !== 'administrador' && req.user.empresa_id !== empresa_id) {
        return res.status(403).json({ 
          error: 'Sem permissão para criar usuário em outra empresa' 
        });
      }

      // Verificar se empresa existe e está ativa
      const empresaCheck = await pool.query(
        'SELECT id FROM empresas WHERE id = $1 AND ativo = true',
        [empresa_id]
      );

      if (empresaCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Empresa não encontrada ou inativa' });
      }

      // Verificar se email já existe
      const emailCheck = await pool.query(
        'SELECT id FROM usuarios WHERE email = $1',
        [email.toLowerCase()]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Verificar se CPF já existe (se fornecido)
      if (cpf) {
        const cpfCheck = await pool.query(
          'SELECT id FROM usuarios WHERE cpf = $1',
          [cpf]
        );

        if (cpfCheck.rows.length > 0) {
          return res.status(400).json({ error: 'CPF já cadastrado' });
        }
      }

      // Gerar hash da senha
      const senhaHash = await bcrypt.hash(senha, 10);

      // Inserir usuário
      const result = await pool.query(
        `INSERT INTO usuarios (
          empresa_id, nome, email, senha_hash, cpf, tipo_profissional, perfil
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, empresa_id, nome, email, cpf, tipo_profissional, perfil, ativo, created_at`,
        [empresa_id, nome, email.toLowerCase(), senhaHash, cpf, tipo_profissional, perfil]
      );

      return res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Usuário criado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  },

  // Atualizar usuário
  async atualizar(req, res) {
    try {
      const { id } = req.params;

      // Verificar se pode atualizar este usuário
      const userCheck = await pool.query(
        'SELECT empresa_id FROM usuarios WHERE id = $1',
        [id]
      );

      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const usuario = userCheck.rows[0];

      // Só admin ou usuário da mesma empresa pode atualizar
      if (req.user.perfil !== 'administrador' && req.user.empresa_id !== usuario.empresa_id) {
        return res.status(403).json({ error: 'Sem permissão para atualizar este usuário' });
      }

      // Não pode atualizar a si mesmo para remover admin
      if (id === req.user.id && req.body.perfil === 'usuario' && req.user.perfil === 'administrador') {
        return res.status(400).json({ 
          error: 'Você não pode remover seu próprio perfil de administrador' 
        });
      }

      // Validar dados
      const { error, value } = usuarioUpdateSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: error.details.map(d => d.message) 
        });
      }

      const { nome, email, senha, cpf, tipo_profissional, perfil } = value;

      // Verificar email duplicado
      if (email) {
        const emailCheck = await pool.query(
          'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
          [email.toLowerCase(), id]
        );

        if (emailCheck.rows.length > 0) {
          return res.status(400).json({ error: 'Email já cadastrado' });
        }
      }

      // Verificar CPF duplicado
      if (cpf) {
        const cpfCheck = await pool.query(
          'SELECT id FROM usuarios WHERE cpf = $1 AND id != $2',
          [cpf, id]
        );

        if (cpfCheck.rows.length > 0) {
          return res.status(400).json({ error: 'CPF já cadastrado' });
        }
      }

      // Montar query de atualização
      const updates = [];
      const params = [];
      let paramCount = 1;

      if (nome) {
        updates.push(`nome = $${paramCount}`);
        params.push(nome);
        paramCount++;
      }

      if (email) {
        updates.push(`email = $${paramCount}`);
        params.push(email.toLowerCase());
        paramCount++;
      }

      if (senha) {
        const senhaHash = await bcrypt.hash(senha, 10);
        updates.push(`senha_hash = $${paramCount}`);
        params.push(senhaHash);
        paramCount++;
      }

      if (cpf !== undefined) {
        updates.push(`cpf = $${paramCount}`);
        params.push(cpf);
        paramCount++;
      }

      if (tipo_profissional !== undefined) {
        updates.push(`tipo_profissional = $${paramCount}`);
        params.push(tipo_profissional);
        paramCount++;
      }

      if (perfil) {
        updates.push(`perfil = $${paramCount}`);
        params.push(perfil);
        paramCount++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar' });
      }

      params.push(id);

      const query = `
        UPDATE usuarios 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, empresa_id, nome, email, cpf, tipo_profissional, perfil, ativo, created_at
      `;

      const result = await pool.query(query, params);

      return res.json({
        success: true,
        data: result.rows[0],
        message: 'Usuário atualizado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
  },

  // Desativar usuário
  async desativar(req, res) {
    try {
      const { id } = req.params;

      // Não pode desativar a si mesmo
      if (id === req.user.id) {
        return res.status(400).json({ 
          error: 'Você não pode desativar seu próprio usuário' 
        });
      }

      // Verificar permissão
      const userCheck = await pool.query(
        'SELECT empresa_id FROM usuarios WHERE id = $1',
        [id]
      );

      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      if (req.user.perfil !== 'administrador' && req.user.empresa_id !== userCheck.rows[0].empresa_id) {
        return res.status(403).json({ error: 'Sem permissão para desativar este usuário' });
      }

      const result = await pool.query(
        'UPDATE usuarios SET ativo = false WHERE id = $1 RETURNING *',
        [id]
      );

      return res.json({
        success: true,
        message: 'Usuário desativado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      return res.status(500).json({ error: 'Erro ao desativar usuário' });
    }
  },

  // Reativar usuário
  async reativar(req, res) {
    try {
      const { id } = req.params;

      // Verificar permissão
      const userCheck = await pool.query(
        'SELECT empresa_id FROM usuarios WHERE id = $1',
        [id]
      );

      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      if (req.user.perfil !== 'administrador' && req.user.empresa_id !== userCheck.rows[0].empresa_id) {
        return res.status(403).json({ error: 'Sem permissão para reativar este usuário' });
      }

      const result = await pool.query(
        'UPDATE usuarios SET ativo = true WHERE id = $1 RETURNING *',
        [id]
      );

      return res.json({
        success: true,
        message: 'Usuário reativado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao reativar usuário:', error);
      return res.status(500).json({ error: 'Erro ao reativar usuário' });
    }
  },

  // Deletar usuário permanentemente
  async deletar(req, res) {
    try {
      const { id } = req.params;

      // Não pode deletar a si mesmo
      if (id === req.user.id) {
        return res.status(400).json({ 
          error: 'Você não pode deletar seu próprio usuário' 
        });
      }

      // Verificar permissão (apenas admin)
      const result = await pool.query(
        'DELETE FROM usuarios WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.json({
        success: true,
        message: 'Usuário deletado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      return res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
  },
};

module.exports = usuarioController;