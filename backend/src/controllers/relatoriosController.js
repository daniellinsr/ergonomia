const pool = require('../config/database');

const relatoriosController = {
  // Inventário de Riscos
  async inventarioRiscos(req, res) {
    try {
      const empresaId = req.user.empresa_id;
      const { setor_id, data_inicio, data_fim } = req.query;

      let query = `
        SELECT 
          a.id,
          a.data_avaliacao,
          a.tipo_avaliacao,
          a.observacoes_gerais,
          t.nome as trabalhador_nome,
          t.cargo,
          t.cpf,
          s.nome as setor_nome,
          u.nome as unidade_nome,
          COUNT(DISTINCT pi.id) FILTER (WHERE pi.identificado = true) as total_perigos,
          MAX(cr.classificacao_final) as classificacao_risco,
          MAX(cr.nivel_risco) as nivel_risco
        FROM avaliacoes_ergonomicas a
        LEFT JOIN trabalhadores t ON a.trabalhador_id = t.id
        LEFT JOIN setores s ON a.setor_id = s.id
        LEFT JOIN unidades u ON s.unidade_id = u.id
        LEFT JOIN perigos_identificados pi ON a.id = pi.avaliacao_id
        LEFT JOIN classificacao_risco cr ON pi.id = cr.perigo_identificado_id
        WHERE a.empresa_id = $1
      `;

      const params = [empresaId];
      let paramIndex = 2;

      if (setor_id) {
        query += ` AND a.setor_id = $${paramIndex}`;
        params.push(setor_id);
        paramIndex++;
      }

      if (data_inicio) {
        query += ` AND a.data_avaliacao >= $${paramIndex}`;
        params.push(data_inicio);
        paramIndex++;
      }

      if (data_fim) {
        query += ` AND a.data_avaliacao <= $${paramIndex}`;
        params.push(data_fim);
        paramIndex++;
      }

      query += ` 
        GROUP BY a.id, t.nome, t.cargo, t.cpf, s.nome, u.nome
        ORDER BY 
          MAX(cr.nivel_risco) DESC NULLS LAST,
          a.data_avaliacao DESC
      `;

      const result = await pool.query(query, params);

      // Agrupar por nível de risco
      const riscosPorNivel = {
        intoleravel: [],
        substancial: [],
        moderado: [],
        toleravel: [],
        trivial: []
      };

      result.rows.forEach(row => {
        const nivel = (row.classificacao_risco || 'trivial').toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove acentos
        const nivelKey = nivel.replace(/\s+/g, ''); // Remove espaços
        
        if (riscosPorNivel[nivelKey]) {
          riscosPorNivel[nivelKey].push(row);
        } else {
          riscosPorNivel.trivial.push(row);
        }
      });

      // Estatísticas
      const stats = {
        total: result.rows.length,
        intoleravel: riscosPorNivel.intoleravel.length,
        substancial: riscosPorNivel.substancial.length,
        moderado: riscosPorNivel.moderado.length,
        toleravel: riscosPorNivel.toleravel.length,
        trivial: riscosPorNivel.trivial.length,
      };

      res.json({
        riscosPorNivel,
        stats,
        riscos: result.rows,
      });
    } catch (error) {
      console.error('Erro ao buscar inventário de riscos:', error);
      res.status(500).json({ error: 'Erro ao buscar inventário de riscos' });
    }
  },

  // Estatísticas Gerais
  async estatisticasGerais(req, res) {
    try {
      const empresaId = req.user.empresa_id;

      // Total de trabalhadores
      const trabalhadores = await pool.query(
        'SELECT COUNT(*) as total FROM trabalhadores WHERE empresa_id = $1',
        [empresaId]
      );

      // Total de avaliações
      const avaliacoes = await pool.query(
        'SELECT COUNT(*) as total FROM avaliacoes_ergonomicas WHERE empresa_id = $1',
        [empresaId]
      );

      // Avaliações por tipo
      const porTipo = await pool.query(
        `SELECT tipo_avaliacao, COUNT(*) as total 
         FROM avaliacoes_ergonomicas 
         WHERE empresa_id = $1 
         GROUP BY tipo_avaliacao`,
        [empresaId]
      );

      // Avaliações por classificação de risco (pegar a pior classificação de cada avaliação)
      const porRisco = await pool.query(
        `SELECT 
          cr.classificacao_final as classificacao_risco,
          COUNT(DISTINCT a.id) as total
         FROM avaliacoes_ergonomicas a
         LEFT JOIN perigos_identificados pi ON a.id = pi.avaliacao_id
         LEFT JOIN classificacao_risco cr ON pi.id = cr.perigo_identificado_id
         WHERE a.empresa_id = $1 AND cr.classificacao_final IS NOT NULL
         GROUP BY cr.classificacao_final`,
        [empresaId]
      );

      // Planos de ação
      const planos5w2h = await pool.query(
        `SELECT status, COUNT(*) as total 
         FROM planos_5w2h 
         WHERE empresa_id = $1 
         GROUP BY status`,
        [empresaId]
      );

      const acoesCorretivas = await pool.query(
        `SELECT status, COUNT(*) as total 
         FROM acoes_corretivas 
         WHERE empresa_id = $1 
         GROUP BY status`,
        [empresaId]
      );

      const ciclosPDCA = await pool.query(
        `SELECT status, COUNT(*) as total 
         FROM ciclos_pdca 
         WHERE empresa_id = $1 
         GROUP BY status`,
        [empresaId]
      );

      // Avaliações por mês (últimos 6 meses)
      const porMes = await pool.query(
        `SELECT 
          TO_CHAR(data_avaliacao, 'YYYY-MM') as mes,
          COUNT(*) as total
         FROM avaliacoes_ergonomicas 
         WHERE empresa_id = $1 
           AND data_avaliacao >= NOW() - INTERVAL '6 months'
         GROUP BY TO_CHAR(data_avaliacao, 'YYYY-MM')
         ORDER BY mes`,
        [empresaId]
      );

      res.json({
        trabalhadores: parseInt(trabalhadores.rows[0].total),
        avaliacoes: parseInt(avaliacoes.rows[0].total),
        porTipo: porTipo.rows,
        porRisco: porRisco.rows,
        planos: {
          planos5w2h: planos5w2h.rows,
          acoesCorretivas: acoesCorretivas.rows,
          ciclosPDCA: ciclosPDCA.rows,
        },
        porMes: porMes.rows,
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas gerais:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas gerais' });
    }
  },

  // Relatório por Setor
  async relatorioPorSetor(req, res) {
    try {
      const empresaId = req.user.empresa_id;

      const result = await pool.query(
        `SELECT 
          s.id as setor_id,
          s.nome as setor_nome,
          u.nome as unidade_nome,
          COUNT(DISTINCT t.id) as total_trabalhadores,
          COUNT(DISTINCT a.id) as total_avaliacoes,
          COUNT(DISTINCT CASE WHEN cr.classificacao_final = 'Intolerável' THEN a.id END) as riscos_intoleraveis,
          COUNT(DISTINCT CASE WHEN cr.classificacao_final = 'Substancial' THEN a.id END) as riscos_substanciais,
          COUNT(DISTINCT CASE WHEN cr.classificacao_final = 'Moderado' THEN a.id END) as riscos_moderados
         FROM setores s
         JOIN unidades u ON s.unidade_id = u.id
         LEFT JOIN trabalhadores t ON s.id = t.setor_id AND t.empresa_id = $1
         LEFT JOIN avaliacoes_ergonomicas a ON t.id = a.trabalhador_id
         LEFT JOIN perigos_identificados pi ON a.id = pi.avaliacao_id
         LEFT JOIN classificacao_risco cr ON pi.id = cr.perigo_identificado_id
         WHERE u.empresa_id = $1
         GROUP BY s.id, s.nome, u.nome
         ORDER BY riscos_intoleraveis DESC, riscos_substanciais DESC`,
        [empresaId]
      );

      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar relatório por setor:', error);
      res.status(500).json({ error: 'Erro ao buscar relatório por setor' });
    }
  },

  // Relatório por Trabalhador
  async relatorioPorTrabalhador(req, res) {
    try {
      const empresaId = req.user.empresa_id;
      const { setor_id } = req.query;

      let query = `
        SELECT 
          t.id,
          t.nome,
          t.cargo,
          t.cpf,
          s.nome as setor_nome,
          u.nome as unidade_nome,
          COUNT(DISTINCT a.id) as total_avaliacoes,
          MAX(a.data_avaliacao) as ultima_avaliacao,
          (
            SELECT cr.classificacao_final
            FROM avaliacoes_ergonomicas aa
            LEFT JOIN perigos_identificados pi ON aa.id = pi.avaliacao_id
            LEFT JOIN classificacao_risco cr ON pi.id = cr.perigo_identificado_id
            WHERE aa.trabalhador_id = t.id AND cr.classificacao_final IS NOT NULL
            ORDER BY cr.nivel_risco DESC
            LIMIT 1
          ) as maior_risco
         FROM trabalhadores t
         LEFT JOIN setores s ON t.setor_id = s.id
         LEFT JOIN unidades u ON s.unidade_id = u.id
         LEFT JOIN avaliacoes_ergonomicas a ON t.id = a.trabalhador_id
         WHERE t.empresa_id = $1
      `;

      const params = [empresaId];

      if (setor_id) {
        query += ` AND t.setor_id = $2`;
        params.push(setor_id);
      }

      query += `
         GROUP BY t.id, t.nome, t.cargo, t.cpf, s.nome, u.nome
         ORDER BY t.nome
      `;

      const result = await pool.query(query, params);

      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar relatório por trabalhador:', error);
      res.status(500).json({ error: 'Erro ao buscar relatório por trabalhador' });
    }
  },

  // Relatório Consolidado para PDF
  async relatorioConsolidado(req, res) {
    try {
      const empresaId = req.user.empresa_id;

      // Informações da empresa
      const empresa = await pool.query(
        'SELECT * FROM empresas WHERE id = $1',
        [empresaId]
      );

      // Estatísticas gerais
      const stats = await relatoriosController.getStatsForPDF(empresaId);

      // Inventário de riscos (top 50)
      const riscos = await pool.query(
        `SELECT 
          a.id,
          a.data_avaliacao,
          t.nome as trabalhador,
          t.cargo,
          s.nome as setor,
          a.observacoes_gerais,
          MAX(cr.classificacao_final) as classificacao_risco,
          MAX(cr.nivel_risco) as nivel_risco
         FROM avaliacoes_ergonomicas a
         LEFT JOIN trabalhadores t ON a.trabalhador_id = t.id
         LEFT JOIN setores s ON a.setor_id = s.id
         LEFT JOIN perigos_identificados pi ON a.id = pi.avaliacao_id
         LEFT JOIN classificacao_risco cr ON pi.id = cr.perigo_identificado_id
         WHERE a.empresa_id = $1
         GROUP BY a.id, a.data_avaliacao, t.nome, t.cargo, s.nome, a.observacoes_gerais
         ORDER BY 
           MAX(cr.nivel_risco) DESC NULLS LAST,
           a.data_avaliacao DESC
         LIMIT 50`,
        [empresaId]
      );

      // Planos de ação em andamento
      const planos = await pool.query(
        `SELECT titulo, status, progresso, 'plano5w2h' as tipo FROM planos_5w2h WHERE empresa_id = $1 AND status != 'concluido'
         UNION ALL
         SELECT titulo, status, progresso, 'acao' as tipo FROM acoes_corretivas WHERE empresa_id = $1 AND status != 'concluido'
         UNION ALL
         SELECT titulo, status, progresso, 'pdca' as tipo FROM ciclos_pdca WHERE empresa_id = $1 AND status != 'concluido'
         ORDER BY progresso ASC
         LIMIT 20`,
        [empresaId]
      );

      res.json({
        empresa: empresa.rows[0],
        stats,
        riscos: riscos.rows,
        planos: planos.rows,
        data_geracao: new Date(),
      });
    } catch (error) {
      console.error('Erro ao gerar relatório consolidado:', error);
      res.status(500).json({ error: 'Erro ao gerar relatório consolidado' });
    }
  },

  // Função auxiliar para estatísticas do PDF
  async getStatsForPDF(empresaId) {
    const trabalhadores = await pool.query(
      'SELECT COUNT(*) as total FROM trabalhadores WHERE empresa_id = $1',
      [empresaId]
    );

    const avaliacoes = await pool.query(
      'SELECT COUNT(*) as total FROM avaliacoes_ergonomicas WHERE empresa_id = $1',
      [empresaId]
    );

    const riscosIntoleraveis = await pool.query(
      `SELECT COUNT(DISTINCT a.id) as total 
       FROM avaliacoes_ergonomicas a
       JOIN perigos_identificados pi ON a.id = pi.avaliacao_id
       JOIN classificacao_risco cr ON pi.id = cr.perigo_identificado_id
       WHERE a.empresa_id = $1 AND cr.classificacao_final = 'Intolerável'`,
      [empresaId]
    );

    const riscosSubstanciais = await pool.query(
      `SELECT COUNT(DISTINCT a.id) as total 
       FROM avaliacoes_ergonomicas a
       JOIN perigos_identificados pi ON a.id = pi.avaliacao_id
       JOIN classificacao_risco cr ON pi.id = cr.perigo_identificado_id
       WHERE a.empresa_id = $1 AND cr.classificacao_final = 'Substancial'`,
      [empresaId]
    );

    const planosAtivos = await pool.query(
      `SELECT COUNT(*) as total FROM (
        SELECT id FROM planos_5w2h WHERE empresa_id = $1 AND status IN ('pendente', 'andamento')
        UNION ALL
        SELECT id FROM acoes_corretivas WHERE empresa_id = $1 AND status IN ('pendente', 'andamento')
        UNION ALL
        SELECT id FROM ciclos_pdca WHERE empresa_id = $1 AND status IN ('pendente', 'andamento')
      ) as planos`,
      [empresaId]
    );

    return {
      total_trabalhadores: parseInt(trabalhadores.rows[0].total),
      total_avaliacoes: parseInt(avaliacoes.rows[0].total),
      riscos_intoleraveis: parseInt(riscosIntoleraveis.rows[0].total),
      riscos_substanciais: parseInt(riscosSubstanciais.rows[0].total),
      planos_ativos: parseInt(planosAtivos.rows[0].total),
    };
  },
};

module.exports = relatoriosController;
