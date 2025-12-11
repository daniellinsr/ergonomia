require('dotenv').config();
const pool = require('./src/config/database');

async function testarRelatorioDetalhado() {
  try {
    console.log('🔍 Testando Relatório Detalhado de Avaliações...\n');

    // 1. Verificar total de avaliações
    const totalAvaliacoes = await pool.query(
      'SELECT COUNT(*) as total FROM avaliacoes_ergonomicas'
    );
    console.log('✅ Total de avaliações no banco:', totalAvaliacoes.rows[0].total);

    // 2. Verificar avaliações por empresa
    const avaliacoesPorEmpresa = await pool.query(
      `SELECT
        e.id,
        e.nome_fantasia,
        COUNT(a.id) as total_avaliacoes
       FROM empresas e
       LEFT JOIN avaliacoes_ergonomicas a ON e.id = a.empresa_id
       GROUP BY e.id, e.nome_fantasia`
    );
    console.log('\n📊 Avaliações por empresa:');
    avaliacoesPorEmpresa.rows.forEach(row => {
      console.log(`  - ${row.nome_fantasia}: ${row.total_avaliacoes} avaliações`);
    });

    // 3. Testar query principal (pegando empresa_id da primeira empresa)
    if (avaliacoesPorEmpresa.rows.length > 0) {
      const empresaId = avaliacoesPorEmpresa.rows[0].id;
      console.log(`\n🔍 Testando query principal para empresa: ${avaliacoesPorEmpresa.rows[0].nome_fantasia} (ID: ${empresaId})`);

      const query = `
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
        GROUP BY a.id, e.nome_fantasia, e.razao_social, u.nome, s.nome, usr.nome
        ORDER BY a.data_avaliacao DESC
        LIMIT 5
      `;

      const result = await pool.query(query, [empresaId]);
      console.log(`✅ Query executada com sucesso! ${result.rows.length} avaliações encontradas\n`);

      if (result.rows.length > 0) {
        console.log('📋 Primeira avaliação:');
        console.log(JSON.stringify(result.rows[0], null, 2));
      } else {
        console.log('⚠️  Nenhuma avaliação encontrada para esta empresa');
      }

      // 4. Testar estatísticas
      console.log('\n🔍 Testando estatísticas...');

      const porStatus = await pool.query(
        `SELECT status, COUNT(*) as total
         FROM avaliacoes_ergonomicas
         WHERE empresa_id = $1
         GROUP BY status`,
        [empresaId]
      );
      console.log('✅ Por status:', porStatus.rows);

      const perigosMaisIdentificados = await pool.query(
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
         LIMIT 5`,
        [empresaId]
      );
      console.log('✅ Top 5 perigos mais identificados:', perigosMaisIdentificados.rows.length);

      const porTipo = await pool.query(
        `SELECT tipo_avaliacao, COUNT(*) as total
         FROM avaliacoes_ergonomicas
         WHERE empresa_id = $1
         GROUP BY tipo_avaliacao`,
        [empresaId]
      );
      console.log('✅ Por tipo:', porTipo.rows);
    }

    console.log('\n✅ Teste concluído!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao testar:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testarRelatorioDetalhado();
