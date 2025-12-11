#!/bin/bash

# Script DEFINITIVO para reindexação por categoria com COMMIT garantido

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  REINDEXAÇÃO DEFINITIVA${NC}"
echo -e "${BLUE}  Com COMMIT Garantido${NC}"
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

echo -e "${YELLOW}ANTES:${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, descricao FROM perigos_catalogo WHERE categoria = 'Mobiliário/Equipamentos' ORDER BY numero LIMIT 3;
"

echo ""
read -p "Confirma reindexação? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⚠️  Cancelado${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Executando...${NC}"
echo ""

# SQL direto com autocommit
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
-- Remover constraints
ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_numero_key;
ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_categoria_numero_key;

-- Criar tabela temp com nova numeração
CREATE TEMP TABLE reindex_temp AS
SELECT
    id,
    categoria,
    ROW_NUMBER() OVER (PARTITION BY categoria ORDER BY numero) as novo_numero
FROM perigos_catalogo;

-- Update direto (sem transação explícita = autocommit)
UPDATE perigos_catalogo p
SET numero = -p.id  -- Primeiro negativos
FROM reindex_temp t
WHERE p.id = t.id;

UPDATE perigos_catalogo p
SET numero = t.novo_numero  -- Depois novos números
FROM reindex_temp t
WHERE p.id = t.id;

-- Recriar constraint
ALTER TABLE perigos_catalogo ADD CONSTRAINT perigos_catalogo_categoria_numero_key UNIQUE (categoria, numero);

-- Verificar
SELECT 'RESULTADO:' as status;
SELECT categoria, MIN(numero) as min, MAX(numero) as max, COUNT(*) as total
FROM perigos_catalogo
GROUP BY categoria
ORDER BY MIN(numero);
"

echo ""
echo -e "${YELLOW}DEPOIS (verificação):${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 50) as descricao
FROM perigos_catalogo
WHERE categoria = 'Mobiliário/Equipamentos'
ORDER BY numero
LIMIT 5;
"

echo ""
echo -e "${GREEN}✅ Concluído!${NC}"
echo ""
