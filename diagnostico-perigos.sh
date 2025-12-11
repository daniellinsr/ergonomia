#!/bin/bash

# Script para diagnosticar estado atual dos perigos

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  DIAGNÓSTICO DE PERIGOS${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Carregar variáveis do .env
if [ ! -f .env ]; then
    echo -e "${RED}❌ Erro: Arquivo .env não encontrado!${NC}"
    exit 1
fi

set -a
source .env
set +a

# Verificar PostgreSQL
POSTGRES_CONTAINER=$(docker ps --filter "name=ergonomia_postgres" --format "{{.Names}}" | grep -v backup | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo -e "${RED}❌ Erro: Container PostgreSQL não encontrado!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL: $POSTGRES_CONTAINER${NC}"
echo ""

# Total de perigos
echo -e "${YELLOW}1. Total de perigos:${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT COUNT(*) as total FROM perigos_catalogo;
"

echo ""
echo -e "${YELLOW}2. Faixa de numeração:${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT MIN(numero) as minimo, MAX(numero) as maximo FROM perigos_catalogo;
"

echo ""
echo -e "${YELLOW}3. Perigo 'Trabalho em condições de difícil comunicação':${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, categoria, descricao
FROM perigos_catalogo
WHERE descricao LIKE '%difícil comunicação%'
ORDER BY numero;
"

echo ""
echo -e "${YELLOW}4. Distribuição por categoria:${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
    categoria,
    COUNT(*) as total,
    MIN(numero)::text || ' - ' || MAX(numero)::text as faixa
FROM perigos_catalogo
GROUP BY categoria
ORDER BY MIN(numero);
"

echo ""
echo -e "${YELLOW}5. Todos os perigos da categoria 'Condições Físicas/Ambientais':${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 70) as descricao
FROM perigos_catalogo
WHERE categoria = 'Condições Físicas/Ambientais'
ORDER BY numero;
"

echo ""
echo -e "${YELLOW}6. Últimos 10 perigos (por número):${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, categoria, LEFT(descricao, 50) as descricao
FROM perigos_catalogo
ORDER BY numero DESC
LIMIT 10;
"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
