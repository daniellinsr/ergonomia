#!/bin/bash

# Script direto para diagnosticar empresa_id

echo "=== Diagnóstico: Empresa ID das Avaliações ==="
echo ""

# Encontrar o container correto
echo "🔍 Listando containers do PostgreSQL..."
docker ps --filter "name=postgres" --format "{{.ID}} {{.Names}}"
echo ""

# Pegar apenas o primeiro ID
CONTAINER_ID=$(docker ps --filter "name=postgres" --format "{{.ID}}" | head -1)

echo "📦 Usando container: $CONTAINER_ID"
echo ""

echo "1. Verificando empresas cadastradas:"
docker exec $CONTAINER_ID psql -U postgres ergonomia_db -c "SELECT id, nome_fantasia, razao_social FROM empresas ORDER BY created_at;"

echo ""
echo "2. Verificando empresa_id do usuário logado (341df671-aaad-445d-805f-af345bf8af41):"
docker exec $CONTAINER_ID psql -U postgres ergonomia_db -c "SELECT u.id, u.nome, u.email, u.empresa_id, e.nome_fantasia FROM usuarios u LEFT JOIN empresas e ON u.empresa_id = e.id WHERE u.empresa_id = '341df671-aaad-445d-805f-af345bf8af41';"

echo ""
echo "3. Verificando distribuição de avaliações por empresa_id:"
docker exec $CONTAINER_ID psql -U postgres ergonomia_db -c "SELECT a.empresa_id, e.nome_fantasia, COUNT(a.id) as total_avaliacoes FROM avaliacoes_ergonomicas a LEFT JOIN empresas e ON a.empresa_id = e.id GROUP BY a.empresa_id, e.nome_fantasia ORDER BY total_avaliacoes DESC;"

echo ""
echo "4. Verificando todas as avaliações (primeiras 10):"
docker exec $CONTAINER_ID psql -U postgres ergonomia_db -c "SELECT a.id, SUBSTRING(a.titulo, 1, 40) as titulo, a.empresa_id, e.nome_fantasia, a.data_avaliacao FROM avaliacoes_ergonomicas a LEFT JOIN empresas e ON a.empresa_id = e.id ORDER BY a.data_avaliacao DESC LIMIT 10;"

echo ""
echo "5. Total de avaliações:"
docker exec $CONTAINER_ID psql -U postgres ergonomia_db -c "SELECT COUNT(*) as total FROM avaliacoes_ergonomicas;"

echo ""
echo "=== Diagnóstico Concluído ==="
