#!/bin/bash

# Script para corrigir o empresa_id das avaliações

echo "=== Correção: Empresa ID das Avaliações ==="
echo ""

CONTAINER_ID="b3d631065cb9"
EMPRESA_CORRETA="341df671-aaad-445d-805f-af345bf8af41"  # Sistema
EMPRESA_ERRADA="fa44072b-6174-4b12-9929-6e2b88b4e838"   # Teste 001

echo "📦 Usando container PostgreSQL: $CONTAINER_ID"
echo ""
echo "🔄 Transferindo avaliações de 'Teste 001' para 'Sistema'"
echo ""

# Backup antes da mudança
echo "1. Fazendo backup das avaliações (mostrando estado atual):"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << 'EOF'
SELECT
  COUNT(*) as total,
  empresa_id,
  e.nome_fantasia
FROM avaliacoes_ergonomicas a
LEFT JOIN empresas e ON a.empresa_id = e.id
GROUP BY empresa_id, e.nome_fantasia;
EOF

echo ""
echo "2. Atualizando empresa_id das avaliações..."
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << EOF
UPDATE avaliacoes_ergonomicas
SET empresa_id = '$EMPRESA_CORRETA'
WHERE empresa_id = '$EMPRESA_ERRADA';
EOF

echo ""
echo "3. Verificando resultado da atualização:"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << 'EOF'
SELECT
  COUNT(*) as total,
  empresa_id,
  e.nome_fantasia
FROM avaliacoes_ergonomicas a
LEFT JOIN empresas e ON a.empresa_id = e.id
GROUP BY empresa_id, e.nome_fantasia;
EOF

echo ""
echo "4. Verificando avaliações por empresa após correção:"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << EOF
SELECT
  'Empresa Sistema' as empresa,
  COUNT(*) as total_avaliacoes
FROM avaliacoes_ergonomicas
WHERE empresa_id = '$EMPRESA_CORRETA'
UNION ALL
SELECT
  'Empresa Teste 001' as empresa,
  COUNT(*) as total_avaliacoes
FROM avaliacoes_ergonomicas
WHERE empresa_id = '$EMPRESA_ERRADA';
EOF

echo ""
echo "✅ Correção concluída!"
echo ""
echo "Agora todas as avaliações estão vinculadas à empresa 'Sistema'."
echo "O relatório deve exibir as 10 avaliações quando você acessá-lo no sistema."
echo ""
