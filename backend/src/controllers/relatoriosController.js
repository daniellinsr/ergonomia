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
          a.titulo,
          a.descricao,
          a.observacoes_gerais,
          s.nome as setor_nome,
          u.nome as unidade_nome,
          COUNT(DISTINCT pi.id) FILTER (WHERE pi.identificado = true) as total_perigos,
          MAX(cr.classificacao_final) as classificacao_risco,
          MAX(cr.nivel_risco) as nivel_risco
        FROM avaliacoes_ergonomicas a
        JOIN setores s ON a.setor_id = s.id
        JOIN unidades u ON s.unidade_id = u.id
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
        GROUP BY a.id, a.titulo, a.descricao, s.nome, u.nome
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

      // Total de setores
      const setores = await pool.query(
        `SELECT COUNT(*) as total
         FROM setores s
         JOIN unidades u ON s.unidade_id = u.id
         WHERE u.empresa_id = $1`,
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
        setores: parseInt(setores.rows[0].total),
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
          COUNT(DISTINCT a.id) as total_avaliacoes,
          COUNT(DISTINCT CASE WHEN cr.classificacao_final = 'Intolerável' THEN a.id END) as riscos_intoleraveis,
          COUNT(DISTINCT CASE WHEN cr.classificacao_final = 'Substancial' THEN a.id END) as riscos_substanciais,
          COUNT(DISTINCT CASE WHEN cr.classificacao_final = 'Moderado' THEN a.id END) as riscos_moderados
         FROM setores s
         JOIN unidades u ON s.unidade_id = u.id
         LEFT JOIN avaliacoes_ergonomicas a ON s.id = a.setor_id AND a.empresa_id = $1
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

  // Relatório de Avaliações por Setor
  async relatorioAvaliacoesPorSetor(req, res) {
    try {
      const empresaId = req.user.empresa_id;
      const { setor_id } = req.query;

      let query = `
        SELECT
          a.id,
          a.titulo,
          a.descricao,
          a.data_avaliacao,
          a.tipo_avaliacao,
          s.nome as setor_nome,
          u.nome as unidade_nome,
          COUNT(DISTINCT pi.id) FILTER (WHERE pi.identificado = true) as total_perigos,
          MAX(a.data_avaliacao) as ultima_avaliacao,
          (
            SELECT cr.classificacao_final
            FROM perigos_identificados pi2
            LEFT JOIN classificacao_risco cr ON pi2.id = cr.perigo_identificado_id
            WHERE pi2.avaliacao_id = a.id AND cr.classificacao_final IS NOT NULL
            ORDER BY cr.nivel_risco DESC
            LIMIT 1
          ) as maior_risco
         FROM avaliacoes_ergonomicas a
         JOIN setores s ON a.setor_id = s.id
         JOIN unidades u ON s.unidade_id = u.id
         LEFT JOIN perigos_identificados pi ON a.id = pi.avaliacao_id
         WHERE a.empresa_id = $1
      `;

      const params = [empresaId];

      if (setor_id) {
        query += ` AND a.setor_id = $2`;
        params.push(setor_id);
      }

      query += `
         GROUP BY a.id, a.titulo, a.descricao, a.data_avaliacao, a.tipo_avaliacao, s.nome, u.nome
         ORDER BY a.data_avaliacao DESC
      `;

      const result = await pool.query(query, params);

      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar relatório de avaliações:', error);
      res.status(500).json({ error: 'Erro ao buscar relatório de avaliações' });
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
          a.titulo,
          a.descricao,
          s.nome as setor,
          u.nome as unidade,
          a.observacoes_gerais,
          MAX(cr.classificacao_final) as classificacao_risco,
          MAX(cr.nivel_risco) as nivel_risco
         FROM avaliacoes_ergonomicas a
         JOIN setores s ON a.setor_id = s.id
         JOIN unidades u ON s.unidade_id = u.id
         LEFT JOIN perigos_identificados pi ON a.id = pi.avaliacao_id
         LEFT JOIN classificacao_risco cr ON pi.id = cr.perigo_identificado_id
         WHERE a.empresa_id = $1
         GROUP BY a.id, a.data_avaliacao, a.titulo, a.descricao, s.nome, u.nome, a.observacoes_gerais
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

  // Relatório Detalhado de Avaliações com Perigos
  async relatorioDetalhadoAvaliacoes(req, res) {
    try {
      const empresaId = req.user.empresa_id;
      const { data_inicio, data_fim } = req.query;

      // Query principal para pegar as avaliações
      let query = `
        SELECT
          a.id,
          a.titulo,
          a.descricao,
          a.tipo_avaliacao,
          a.data_avaliacao,
          a.status,
          e.nome_fantasia as empresa_nome,
          e.razao_social as empresa_razao,
          u.nome as unidade_nome,
          s.nome as setor_nome,
          usr.nome as avaliador_nome,
          COUNT(DISTINCT pi.id) FILTER (WHERE pi.identificado = true) as total_perigos_identificados,
          MAX(cr.classificacao_final) as maior_risco
        FROM avaliacoes_ergonomicas a
        JOIN empresas e ON a.empresa_id = e.id
        JOIN setores s ON a.setor_id = s.id
        JOIN unidades u ON s.unidade_id = u.id
        JOIN usuarios usr ON a.avaliador_id = usr.id
        LEFT JOIN perigos_identificados pi ON a.id = pi.avaliacao_id
        LEFT JOIN classificacao_risco cr ON pi.id = cr.perigo_identificado_id
        WHERE a.empresa_id = $1
      `;

      const params = [empresaId];
      let paramIndex = 2;

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
        GROUP BY a.id, e.nome_fantasia, e.razao_social, u.nome, s.nome, usr.nome
        ORDER BY a.data_avaliacao DESC
      `;

      const avaliacoes = await pool.query(query, params);

      // Para cada avaliação, buscar detalhes dos perigos identificados
      const avaliacoesDetalhadas = await Promise.all(
        avaliacoes.rows.map(async (avaliacao) => {
          const perigosQuery = `
            SELECT
              p.numero as codigo,
              p.descricao as perigo_descricao,
              pi.identificado,
              cr.severidade,
              cr.probabilidade,
              cr.nivel_risco,
              cr.classificacao_final
            FROM perigos_catalogo p
            LEFT JOIN perigos_identificados pi ON p.id = pi.perigo_id AND pi.avaliacao_id = $1
            LEFT JOIN classificacao_risco cr ON pi.id = cr.perigo_identificado_id
            ORDER BY p.numero
          `;

          const perigos = await pool.query(perigosQuery, [avaliacao.id]);

          return {
            ...avaliacao,
            perigos: perigos.rows
          };
        })
      );

      // Estatísticas para os gráficos
      const estatisticas = {
        por_status: await pool.query(
          `SELECT status, COUNT(*) as total
           FROM avaliacoes_ergonomicas
           WHERE empresa_id = $1
           GROUP BY status`,
          [empresaId]
        ),
        perigos_mais_identificados: await pool.query(
          `SELECT
             p.numero as codigo,
             p.descricao,
             COUNT(pi.id) as total
           FROM perigos_catalogo p
           JOIN perigos_identificados pi ON p.id = pi.perigo_id
           JOIN avaliacoes_ergonomicas a ON pi.avaliacao_id = a.id
           WHERE a.empresa_id = $1 AND pi.identificado = true
           GROUP BY p.numero, p.descricao
           ORDER BY total DESC
           LIMIT 15`,
          [empresaId]
        ),
        por_tipo: await pool.query(
          `SELECT tipo_avaliacao, COUNT(*) as total
           FROM avaliacoes_ergonomicas
           WHERE empresa_id = $1
           GROUP BY tipo_avaliacao`,
          [empresaId]
        )
      };

      res.json({
        avaliacoes: avaliacoesDetalhadas,
        estatisticas: {
          por_status: estatisticas.por_status.rows,
          perigos_mais_identificados: estatisticas.perigos_mais_identificados.rows,
          por_tipo: estatisticas.por_tipo.rows
        }
      });
    } catch (error) {
      console.error('Erro ao buscar relatório detalhado de avaliações:', error);
      res.status(500).json({ error: 'Erro ao buscar relatório detalhado de avaliações' });
    }
  },

  // Função auxiliar para estatísticas do PDF
  async getStatsForPDF(empresaId) {
    const setores = await pool.query(
      `SELECT COUNT(*) as total
       FROM setores s
       JOIN unidades u ON s.unidade_id = u.id
       WHERE u.empresa_id = $1`,
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
      total_setores: parseInt(setores.rows[0].total),
      total_avaliacoes: parseInt(avaliacoes.rows[0].total),
      riscos_intoleraveis: parseInt(riscosIntoleraveis.rows[0].total),
      riscos_substanciais: parseInt(riscosSubstanciais.rows[0].total),
      planos_ativos: parseInt(planosAtivos.rows[0].total),
    };
  },
};

module.exports = relatoriosController;
