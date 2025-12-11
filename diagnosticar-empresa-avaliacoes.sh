#!/bin/bash

# Script para diagnosticar o problema de empresa_id nas avaliações

echo "=== Diagnóstico: Empresa ID das Avaliações ==="
echo ""

# Tentar encontrar o container do banco de dados com diferentes padrões
echo "🔍 Procurando container do banco de dados..."
CONTAINER_ID=$(docker ps --filter "name=db" --format "{{.ID}}" | head -1)

if [ -z "$CONTAINER_ID" ]; then
    CONTAINER_ID=$(docker ps --filter "name=postgres" --format "{{.ID}}" | head -1)
fi

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ Tentando listar todos os containers para identificar o banco:"
    docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Image}}"
    echo ""
    echo "Por favor, identifique o container do PostgreSQL acima e execute:"
    echo "  CONTAINER_ID=<id_do_container>"
    echo ""
    read -p "Digite o ID ou nome do container do PostgreSQL: " CONTAINER_INPUT
    CONTAINER_ID=$CONTAINER_INPUT
fi

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ Não foi possível identificar o container!"
    exit 1
fi

echo "📦 Container do banco: $CONTAINER_ID"
echo ""

# Testar conexão
echo "🔍 Testando conexão com o banco..."
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db -c "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Não foi possível conectar ao banco. Tentando com usuário 'postgres'..."
    docker exec -i $CONTAINER_ID psql -U postgres -d ergonomia_db -c "SELECT 1;" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        DB_USER="postgres"
    else
        echo "❌ Falha na conexão com o banco de dados!"
        exit 1
    fi
else
    DB_USER="ergonomia_user"
fi

echo "✅ Conectado com usuário: $DB_USER"
echo ""

echo "1. Verificando empresas cadastradas:"
docker exec -i $CONTAINER_ID psql -U $DB_USER -d ergonomia_db -c "
SELECT id, nome_fantasia, razao_social, cnpj
FROM empresas
ORDER BY created_at;
"

echo ""
echo "2. Verificando empresa_id do usuário logado (que está nos logs: 341df671-aaad-445d-805f-af345bf8af41):"
docker exec -i $CONTAINER_ID psql -U $DB_USER -d ergonomia_db -c "
SELECT u.id, u.nome, u.email, u.empresa_id, e.nome_fantasia
FROM usuarios u
LEFT JOIN empresas e ON u.empresa_id = e.id
WHERE u.empresa_id = '341df671-aaad-445d-805f-af345bf8af41';
"

echo ""
echo "3. Verificando distribuição de avaliações por empresa_id:"
docker exec -i $CONTAINER_ID psql -U $DB_USER -d ergonomia_db -c "
SELECT
  a.empresa_id,
  e.nome_fantasia,
  COUNT(a.id) as total_avaliacoes,
  MIN(a.data_avaliacao) as primeira_avaliacao,
  MAX(a.data_avaliacao) as ultima_avaliacao
FROM avaliacoes_ergonomicas a
LEFT JOIN empresas e ON a.empresa_id = e.id
GROUP BY a.empresa_id, e.nome_fantasia
ORDER BY total_avaliacoes DESC;
"

echo ""
echo "4. Verificando todas as avaliações (primeiras 10):"
docker exec -i $CONTAINER_ID psql -U $DB_USER -d ergonomia_db -c "
SELECT
  a.id,
  a.titulo,
  a.empresa_id,
  e.nome_fantasia,
  a.data_avaliacao,
  a.status
FROM avaliacoes_ergonomicas a
LEFT JOIN empresas e ON a.empresa_id = e.id
ORDER BY a.data_avaliacao DESC
LIMIT 10;
"

echo ""
echo "5. Verificando se há avaliações com empresa_id NULL ou inválido:"
docker exec -i $CONTAINER_ID psql -U $DB_USER -d ergonomia_db -c "
SELECT COUNT(*) as total_sem_empresa
FROM avaliacoes_ergonomicas
WHERE empresa_id IS NULL OR empresa_id NOT IN (SELECT id FROM empresas);
"

echo ""
echo "=== Diagnóstico Concluído ==="
