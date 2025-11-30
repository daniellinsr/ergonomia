const pool = require('../config/database');
const Joi = require('joi');
const { calcularProbabilidade, calcularNivelRisco, severidadePesos } = require('../utils/classificacaoRisco');

// Schema de validação para criar avaliação
const avaliacaoSchema = Joi.object({
  trabalhador_id: Joi.string().uuid().required(),
  setor_id: Joi.string().uuid().allow('', null),
  tipo_avaliacao: Joi.string().valid('AEP', 'Completa').default('AEP'),
  observacoes_gerais: Joi.string().allow('', null),
});

// Schema para classificação de risco
const classificacaoSchema = Joi.object({
  severidade: Joi.string().valid('Inexistente', 'Levemente Prejudicial', 'Prejudicial', 'Extremamente Prejudicial').required(),
  tempo_exposicao: Joi.string().valid('Curto', 'Médio', 'Longo').required(),
  intensidade: Joi.string().valid('Baixa', 'Média', 'Alta', 'Altíssima').required(),
  observacoes: Joi.string().allow('', null),
});

const avaliacaoController = {
  // Listar avaliações
  async listar(req, res) {
    try {
      const { page = 1, limit = 20, search = '', empresa_id, status } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          a.*,
          t.nome as trabalhador_nome,
          t.cpf as trabalhador_cpf,
          t.cargo as trabalhador_cargo,
          s.nome as setor_nome,
          u.nome as unidade_nome,
          e.razao_social,
          e.nome_fantasia,
          av.nome as avaliador_nome,
          COUNT(DISTINCT pi.id) FILTER (WHERE pi.identificado = true) as total_perigos_identificados
        FROM avaliacoes_ergonomicas a
        JOIN trabalhadores t ON a.trabalhador_id = t.id
        JOIN empresas e ON a.empresa_id = e.id
        JOIN usuarios av ON a.avaliador_id = av.id
        LEFT JOIN setores s ON a.setor_id = s.id
        LEFT JOIN unidades u ON s.unidade_id = u.id
        LEFT JOIN perigos_identificados pi ON a.id = pi.avaliacao_id
      `;

      const params = [];
      const conditions = [];

      // Filtro por empresa
      if (req.user.perfil !== 'administrador') {
        conditions.push(`a.empresa_id = $${params.length + 1}`);
        params.push(req.user.empresa_id);
      } else if (empresa_id) {
        conditions.push(`a.empresa_id = $${params.length + 1}`);
        params.push(empresa_id);
      }

      // Filtro por status
      if (status) {
        conditions.push(`a.status = $${params.length + 1}`);
        params.push(status);
      }

      // Busca
      if (search) {
        conditions.push(`(
          t.nome ILIKE $${params.length + 1} OR 
          t.cpf ILIKE $${params.length + 1} OR
          s.nome ILIKE $${params.length + 1}
        )`);
        params.push(`%${search}%`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` GROUP BY a.id, t.nome, t.cpf, t.cargo, s.nome, u.nome, e.razao_social, e.nome_fantasia, av.nome 
                 ORDER BY a.created_at DESC`;

      // Contar total
      const countQuery = `
        SELECT COUNT(DISTINCT a.id) as total 
        FROM avaliacoes_ergonomicas a 
        JOIN trabalhadores t ON a.trabalhador_id = t.id
        LEFT JOIN setores s ON a.setor_id = s.id
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
      console.error('Erro ao listar avaliações:', error);
      return res.status(500).json({ error: 'Erro ao listar avaliações' });
    }
  },

  // Buscar avaliação completa por ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;

      // Buscar dados da avaliação
      let query = `
        SELECT 
          a.*,
          t.nome as trabalhador_nome,
          t.cpf as trabalhador_cpf,
          t.cargo as trabalhador_cargo,
          t.funcao as trabalhador_funcao,
          s.nome as setor_nome,
          u.nome as unidade_nome,
          e.razao_social,
          e.nome_fantasia,
          av.nome as avaliador_nome
        FROM avaliacoes_ergonomicas a
        JOIN trabalhadores t ON a.trabalhador_id = t.id
        JOIN empresas e ON a.empresa_id = e.id
        JOIN usuarios av ON a.avaliador_id = av.id
        LEFT JOIN setores s ON a.setor_id = s.id
        LEFT JOIN unidades u ON s.unidade_id = u.id
        WHERE a.id = $1
      `;

      const params = [id];

      if (req.user.perfil !== 'administrador') {
        query += ` AND a.empresa_id = $2`;
        params.push(req.user.empresa_id);
      }

      const avaliacaoResult = await pool.query(query, params);

      if (avaliacaoResult.rows.length === 0) {
        return res.status(404).json({ error: 'Avaliação não encontrada' });
      }

      const avaliacao = avaliacaoResult.rows[0];

      // Buscar perigos identificados com classificação
      const perigosResult = await pool.query(`
        SELECT 
          pi.*,
          pc.numero,
          pc.categoria,
          pc.descricao,
          cr.*
        FROM perigos_identificados pi
        JOIN perigos_catalogo pc ON pi.perigo_id = pc.id
        LEFT JOIN classificacao_risco cr ON pi.id = cr.perigo_identificado_id
        WHERE pi.avaliacao_id = $1
        ORDER BY pc.numero
      `, [id]);

      avaliacao.perigos = perigosResult.rows;

      return res.json({
        success: true,
        data: avaliacao,
      });
    } catch (error) {
      console.error('Erro ao buscar avaliação:', error);
      return res.status(500).json({ error: 'Erro ao buscar avaliação' });
    }
  },

  // Criar nova avaliação
  async criar(req, res) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const { error, value } = avaliacaoSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: error.details.map(d => d.message) 
        });
      }

      const { trabalhador_id, setor_id, tipo_avaliacao, observacoes_gerais } = value;

      // Buscar empresa do trabalhador
      const trabalhadorResult = await client.query(
        'SELECT empresa_id FROM trabalhadores WHERE id = $1',
        [trabalhador_id]
      );

      if (trabalhadorResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Trabalhador não encontrado' });
      }

      const empresa_id = trabalhadorResult.rows[0].empresa_id;

      // Verificar permissão
      if (req.user.perfil !== 'administrador' && req.user.empresa_id !== empresa_id) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Sem permissão' });
      }

      // Criar avaliação
      const avaliacaoResult = await client.query(
        `INSERT INTO avaliacoes_ergonomicas 
         (empresa_id, trabalhador_id, setor_id, avaliador_id, tipo_avaliacao, observacoes_gerais, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'em_andamento')
         RETURNING *`,
        [empresa_id, trabalhador_id, setor_id || null, req.user.id, tipo_avaliacao, observacoes_gerais]
      );

      const avaliacao = avaliacaoResult.rows[0];

      // Criar registros de perigos (todos inicialmente não identificados)
      const perigosResult = await client.query('SELECT id FROM perigos_catalogo ORDER BY numero');
      
      for (const perigo of perigosResult.rows) {
        await client.query(
          `INSERT INTO perigos_identificados (avaliacao_id, perigo_id, identificado)
           VALUES ($1, $2, false)`,
          [avaliacao.id, perigo.id]
        );
      }

      await client.query('COMMIT');

      return res.status(201).json({
        success: true,
        data: avaliacao,
        message: 'Avaliação criada com sucesso',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao criar avaliação:', error);
      return res.status(500).json({ error: 'Erro ao criar avaliação' });
    } finally {
      client.release();
    }
  },

  // Marcar/desmarcar perigo como identificado
  async togglePerigo(req, res) {
    try {
      const { id, perigoId } = req.params;
      const { identificado } = req.body;

      const result = await pool.query(
        `UPDATE perigos_identificados 
         SET identificado = $1
         WHERE avaliacao_id = $2 AND perigo_id = $3
         RETURNING *`,
        [identificado, id, perigoId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Perigo não encontrado' });
      }

      return res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Erro ao atualizar perigo:', error);
      return res.status(500).json({ error: 'Erro ao atualizar perigo' });
    }
  },

  // Classificar risco de um perigo identificado
  // Classificar risco de um perigo identificado
  async classificarRisco(req, res) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const { id: avaliacaoId, perigoId } = req.params;
      
      const { error, value } = classificacaoSchema.validate(req.body);
      
      if (error) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: error.details.map(d => d.message) 
        });
      }

      const { severidade, tempo_exposicao, intensidade, observacoes } = value;

      // Buscar o perigo_identificado_id baseado no perigo_id e avaliacao_id
      const perigoIdentificadoResult = await client.query(
        'SELECT id FROM perigos_identificados WHERE avaliacao_id = $1 AND perigo_id = $2',
        [avaliacaoId, perigoId]
      );

      if (perigoIdentificadoResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Perigo não encontrado para esta avaliação' });
      }

      const perigoIdentificadoId = perigoIdentificadoResult.rows[0].id;

      // Calcular probabilidade
      const { probabilidade, peso: peso_probabilidade } = calcularProbabilidade(tempo_exposicao, intensidade);
      
      // Obter peso da severidade
      const peso_severidade = severidadePesos[severidade];

      // Calcular nível de risco
      const { nivelRisco, classificacao } = calcularNivelRisco(peso_severidade, peso_probabilidade);

      // Verificar se já existe classificação
      const existingResult = await client.query(
        'SELECT id FROM classificacao_risco WHERE perigo_identificado_id = $1',
        [perigoIdentificadoId]
      );

      let result;

      if (existingResult.rows.length > 0) {
        // Atualizar
        result = await client.query(
          `UPDATE classificacao_risco 
           SET severidade = $1, peso_severidade = $2, tempo_exposicao = $3, 
               intensidade = $4, probabilidade = $5, peso_probabilidade = $6,
               nivel_risco = $7, classificacao_final = $8
           WHERE perigo_identificado_id = $9
           RETURNING *`,
          [severidade, peso_severidade, tempo_exposicao, intensidade, 
           probabilidade, peso_probabilidade, nivelRisco, classificacao, perigoIdentificadoId]
        );
      } else {
        // Inserir
        result = await client.query(
          `INSERT INTO classificacao_risco 
           (perigo_identificado_id, severidade, peso_severidade, tempo_exposicao, 
            intensidade, probabilidade, peso_probabilidade, nivel_risco, classificacao_final)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [perigoIdentificadoId, severidade, peso_severidade, tempo_exposicao, 
           intensidade, probabilidade, peso_probabilidade, nivelRisco, classificacao]
        );
      }

      // Marcar perigo como identificado
      await client.query(
        'UPDATE perigos_identificados SET identificado = true, observacoes = $1 WHERE id = $2',
        [observacoes, perigoIdentificadoId]
      );

      await client.query('COMMIT');

      return res.json({
        success: true,
        data: result.rows[0],
        message: 'Risco classificado com sucesso',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao classificar risco:', error);
      return res.status(500).json({ error: 'Erro ao classificar risco' });
    } finally {
      client.release();
    }
  },

  // Finalizar avaliação
  async finalizar(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `UPDATE avaliacoes_ergonomicas 
         SET status = 'concluida'
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Avaliação não encontrada' });
      }

      return res.json({
        success: true,
        data: result.rows[0],
        message: 'Avaliação finalizada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao finalizar avaliação:', error);
      return res.status(500).json({ error: 'Erro ao finalizar avaliação' });
    }
  },

  // Deletar avaliação
  // Reabrir avaliação para edição
  async reabrir(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `UPDATE avaliacoes_ergonomicas 
         SET status = 'em_andamento' 
         WHERE id = $1 
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Avaliação não encontrada' });
      }

      return res.json({
        success: true,
        data: result.rows[0],
        message: 'Avaliação reaberta para edição',
      });
    } catch (error) {
      console.error('Erro ao reabrir avaliação:', error);
      return res.status(500).json({ error: 'Erro ao reabrir avaliação' });
    }
  },


  async deletar(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM avaliacoes_ergonomicas WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Avaliação não encontrada' });
      }

      return res.json({
        success: true,
        message: 'Avaliação deletada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao deletar avaliação:', error);
      return res.status(500).json({ error: 'Erro ao deletar avaliação' });
    }
  },
};

module.exports = avaliacaoController;

  // Adicionar antes do deletar
  reabrir: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `UPDATE avaliacoes_ergonomicas 
         SET status = 'em_andamento'
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Avaliação não encontrada' });
      }

      return res.json({
        success: true,
        data: result.rows[0],
        message: 'Avaliação reaberta para edição',
      });
    } catch (error) {
      console.error('Erro ao reabrir avaliação:', error);
      return res.status(500).json({ error: 'Erro ao reabrir avaliação' });
    }
  }