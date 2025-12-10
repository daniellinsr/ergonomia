#!/bin/bash

# Script para verificar as categorias no banco de dados

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Verificando Categorias - Ergonomia${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Carregar variáveis do .env
if [ ! -f .env ]; then
    echo -e "${RED}❌ Erro: Arquivo .env não encontrado!${NC}"
    exit 1
fi

set -a
source .env
set +a

# Encontrar container do PostgreSQL
POSTGRES_CONTAINER=$(docker ps --filter "name=ergonomia_postgres" --format "{{.Names}}" | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo -e "${RED}❌ Erro: Container PostgreSQL não encontrado!${NC}"
    exit 1
fi

echo -e "${YELLOW}📊 Categorias únicas no banco de dados:${NC}"
docker exec -i $POSTGRES_CONTAINER psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT DISTINCT categoria, COUNT(*) as total FROM perigos_catalogo GROUP BY categoria ORDER BY categoria;"

echo ""
echo -e "${YELLOW}📊 Detalhamento por número:${NC}"
docker exec -i $POSTGRES_CONTAINER psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT categoria, MIN(numero) as primeiro, MAX(numero) as ultimo, COUNT(*) as quantidade FROM perigos_catalogo GROUP BY categoria ORDER BY MIN(numero);"

echo ""
echo -e "${YELLOW}📊 Verificando encoding das categorias (com aspas para ver espaços):${NC}"
docker exec -i $POSTGRES_CONTAINER psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT '\"' || categoria || '\"' as categoria_com_aspas, LENGTH(categoria) as tamanho, COUNT(*) as total FROM perigos_catalogo GROUP BY categoria ORDER BY MIN(numero);"

echo ""
