#!/bin/bash

# Script para diagnosticar o relatório "Por Setor"

echo "=== Diagnóstico: Relatório Por Setor ==="
echo ""

CONTAINER_ID="b3d631065cb9"
EMPRESA_ID="341df671-aaad-445d-805f-af345bf8af41"

echo "📦 Container: $CONTAINER_ID"
echo "🏢 Empresa: Sistema ($EMPRESA_ID)"
echo ""

echo "1. Verificando setores cadastrados:"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << EOF
SELECT
  s.id,
  s.nome as setor_nome,
  u.nome as unidade_nome,
  u.empresa_id
FROM setores s
JOIN unidades u ON s.unidade_id = u.id
WHERE u.empresa_id = '$EMPRESA_ID';
EOF

echo ""
echo "2. Verificando avaliações e seus setores:"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << EOF
SELECT
  a.id,
  a.titulo,
  a.setor_id,
  s.nome as setor_nome,
  u.nome as unidade_nome
FROM avaliacoes_ergonomicas a
LEFT JOIN setores s ON a.setor_id = s.id
LEFT JOIN unidades u ON s.unidade_id = u.id
WHERE a.empresa_id = '$EMPRESA_ID'
ORDER BY a.data_avaliacao DESC;
EOF

echo ""
echo "3. Testando a query exata do relatório 'Por Setor':"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << EOF
SELECT
  s.id as setor_id,
  s.nome as setor_nome,
  u.nome as unidade_nome,
  COUNT(DISTINCT a.id) as total_avaliacoes,
  COUNT(CASE WHEN cr.classificacao_final = 'Intolerável' THEN pi.id END) as riscos_intoleraveis,
  COUNT(CASE WHEN cr.classificacao_final = 'Substancial' THEN pi.id END) as riscos_substanciais,
  COUNT(CASE WHEN cr.classificacao_final = 'Moderado' THEN pi.id END) as riscos_moderados
FROM setores s
JOIN unidades u ON s.unidade_id = u.id
LEFT JOIN avaliacoes_ergonomicas a ON s.id = a.setor_id AND a.empresa_id = '$EMPRESA_ID'
LEFT JOIN perigos_identificados pi ON a.id = pi.avaliacao_id AND pi.identificado = true
LEFT JOIN classificacao_risco cr ON pi.id = cr.perigo_identificado_id
WHERE u.empresa_id = '$EMPRESA_ID'
GROUP BY s.id, s.nome, u.nome
ORDER BY riscos_intoleraveis DESC, riscos_substanciais DESC;
EOF

echo ""
echo "4. Verificando se há perigos identificados:"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << EOF
SELECT
  a.id as avaliacao_id,
  a.titulo,
  COUNT(pi.id) FILTER (WHERE pi.identificado = true) as perigos_identificados,
  COUNT(cr.id) as classificacoes
FROM avaliacoes_ergonomicas a
LEFT JOIN perigos_identificados pi ON a.id = pi.avaliacao_id
LEFT JOIN classificacao_risco cr ON pi.id = cr.perigo_identificado_id
WHERE a.empresa_id = '$EMPRESA_ID'
GROUP BY a.id, a.titulo
ORDER BY a.data_avaliacao DESC;
EOF

echo ""
echo "5. Verificando total de registros em cada tabela:"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << 'EOF'
SELECT 'setores' as tabela, COUNT(*) as total FROM setores
UNION ALL
SELECT 'unidades' as tabela, COUNT(*) as total FROM unidades
UNION ALL
SELECT 'avaliacoes_ergonomicas' as tabela, COUNT(*) as total FROM avaliacoes_ergonomicas
UNION ALL
SELECT 'perigos_identificados' as tabela, COUNT(*) as total FROM perigos_identificados
UNION ALL
SELECT 'classificacao_risco' as tabela, COUNT(*) as total FROM classificacao_risco;
EOF

echo ""
echo "=== Diagnóstico Concluído ==="
