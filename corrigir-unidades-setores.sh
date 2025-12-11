#!/bin/bash

# Script para corrigir empresa_id das unidades e setores

echo "=== Correção: Unidades e Setores ==="
echo ""

CONTAINER_ID="b3d631065cb9"
EMPRESA_CORRETA="341df671-aaad-445d-805f-af345bf8af41"  # Sistema
EMPRESA_ERRADA="fa44072b-6174-4b12-9929-6e2b88b4e838"   # Teste 001

echo "📦 Container: $CONTAINER_ID"
echo "🏢 Transferindo unidades e setores para empresa 'Sistema'"
echo ""

echo "1. Estado atual das unidades:"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << 'EOF'
SELECT
  u.id,
  u.nome as unidade,
  u.empresa_id,
  e.nome_fantasia,
  COUNT(s.id) as total_setores
FROM unidades u
LEFT JOIN empresas e ON u.empresa_id = e.id
LEFT JOIN setores s ON s.unidade_id = u.id
GROUP BY u.id, u.nome, u.empresa_id, e.nome_fantasia
ORDER BY u.created_at;
EOF

echo ""
echo "2. Atualizando empresa_id das unidades que não estão na empresa 'Sistema'..."
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << EOF
UPDATE unidades
SET empresa_id = '$EMPRESA_CORRETA'
WHERE empresa_id != '$EMPRESA_CORRETA' OR empresa_id IS NULL;
EOF

echo ""
echo "3. Verificando unidades após atualização:"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << 'EOF'
SELECT
  u.id,
  u.nome as unidade,
  u.empresa_id,
  e.nome_fantasia,
  COUNT(s.id) as total_setores
FROM unidades u
LEFT JOIN empresas e ON u.empresa_id = e.id
LEFT JOIN setores s ON s.unidade_id = u.id
GROUP BY u.id, u.nome, u.empresa_id, e.nome_fantasia
ORDER BY u.created_at;
EOF

echo ""
echo "4. Verificando setores agora disponíveis para a empresa 'Sistema':"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << EOF
SELECT
  s.id,
  s.nome as setor_nome,
  u.nome as unidade_nome,
  u.empresa_id
FROM setores s
JOIN unidades u ON s.unidade_id = u.id
WHERE u.empresa_id = '$EMPRESA_CORRETA';
EOF

echo ""
echo "5. Testando novamente a query do relatório 'Por Setor':"
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
LEFT JOIN avaliacoes_ergonomicas a ON s.id = a.setor_id AND a.empresa_id = '$EMPRESA_CORRETA'
LEFT JOIN perigos_identificados pi ON a.id = pi.avaliacao_id AND pi.identificado = true
LEFT JOIN classificacao_risco cr ON pi.id = cr.perigo_identificado_id
WHERE u.empresa_id = '$EMPRESA_CORRETA'
GROUP BY s.id, s.nome, u.nome
ORDER BY riscos_intoleraveis DESC, riscos_substanciais DESC;
EOF

echo ""
echo "✅ Correção concluída!"
echo ""
echo "Agora o relatório 'Por Setor' deve exibir os dados corretamente."
echo ""
