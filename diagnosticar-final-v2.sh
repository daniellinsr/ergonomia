#!/bin/bash

# Script final para diagnosticar empresa_id

echo "=== Diagnóstico: Empresa ID das Avaliações ==="
echo ""

CONTAINER_ID="b3d631065cb9"

echo "📦 Usando container PostgreSQL principal: $CONTAINER_ID"
echo ""

# Primeiro, vamos descobrir qual é o usuário correto
echo "🔍 Verificando variáveis de ambiente do PostgreSQL..."
docker exec $CONTAINER_ID env | grep POSTGRES

echo ""
echo "🔍 Tentando conectar com usuário ergonomia_user..."
echo ""

echo "1. Verificando empresas cadastradas:"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << 'EOF'
SELECT id, nome_fantasia, razao_social FROM empresas ORDER BY created_at;
EOF

echo ""
echo "2. Verificando empresa_id do usuário logado (341df671-aaad-445d-805f-af345bf8af41):"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << 'EOF'
SELECT u.id, u.nome, u.email, u.empresa_id, e.nome_fantasia
FROM usuarios u
LEFT JOIN empresas e ON u.empresa_id = e.id
WHERE u.empresa_id = '341df671-aaad-445d-805f-af345bf8af41';
EOF

echo ""
echo "3. Verificando distribuição de avaliações por empresa_id:"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << 'EOF'
SELECT
  a.empresa_id,
  e.nome_fantasia,
  COUNT(a.id) as total_avaliacoes
FROM avaliacoes_ergonomicas a
LEFT JOIN empresas e ON a.empresa_id = e.id
GROUP BY a.empresa_id, e.nome_fantasia
ORDER BY total_avaliacoes DESC;
EOF

echo ""
echo "4. Verificando todas as avaliações (primeiras 10):"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << 'EOF'
SELECT
  SUBSTRING(a.id::text, 1, 8) as id_short,
  SUBSTRING(a.titulo, 1, 40) as titulo,
  SUBSTRING(a.empresa_id::text, 1, 8) as empresa_id_short,
  e.nome_fantasia,
  a.data_avaliacao,
  a.status
FROM avaliacoes_ergonomicas a
LEFT JOIN empresas e ON a.empresa_id = e.id
ORDER BY a.data_avaliacao DESC
LIMIT 10;
EOF

echo ""
echo "5. Total de avaliações:"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << 'EOF'
SELECT COUNT(*) as total FROM avaliacoes_ergonomicas;
EOF

echo ""
echo "6. Verificando todos os usuários e suas empresas:"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << 'EOF'
SELECT
  u.nome,
  u.email,
  SUBSTRING(u.empresa_id::text, 1, 8) as empresa_id_short,
  e.nome_fantasia
FROM usuarios u
LEFT JOIN empresas e ON u.empresa_id = e.id
ORDER BY u.created_at;
EOF

echo ""
echo "=== Diagnóstico Concluído ==="
