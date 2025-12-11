#!/bin/bash

# Script para reindexar UMA CATEGORIA POR VEZ com commit entre cada uma

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  REINDEXAR CATEGORIA POR CATEGORIA${NC}"
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

read -p "Confirma reindexação? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⚠️  Cancelado${NC}"
    exit 0
fi

echo ""

# Remover constraints ANTES de tudo
echo -e "${YELLOW}Removendo constraints...${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_numero_key;
ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_categoria_numero_key;
"
echo ""

# 1. BIOMECÂNICOS (já está 1-16, mas vamos garantir)
echo -e "${BLUE}1/4${NC} ${YELLOW}Biomecânicos...${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY numero) as novo_numero
    FROM perigos_catalogo
    WHERE categoria = 'Biomecânicos'
)
UPDATE perigos_catalogo p
SET numero = r.novo_numero + 10000  -- Temporário alto
FROM ranked r
WHERE p.id = r.id;

WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY numero) as novo_numero
    FROM perigos_catalogo
    WHERE categoria = 'Biomecânicos'
)
UPDATE perigos_catalogo p
SET numero = r.novo_numero  -- Número final
FROM ranked r
WHERE p.id = r.id;
"
echo -e "${GREEN}✓ Biomecânicos: 1-16${NC}"
echo ""

# 2. MOBILIÁRIO/EQUIPAMENTOS
echo -e "${BLUE}2/4${NC} ${YELLOW}Mobiliário/Equipamentos...${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY numero) as novo_numero
    FROM perigos_catalogo
    WHERE categoria = 'Mobiliário/Equipamentos'
)
UPDATE perigos_catalogo p
SET numero = r.novo_numero + 10000
FROM ranked r
WHERE p.id = r.id;

WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY numero) as novo_numero
    FROM perigos_catalogo
    WHERE categoria = 'Mobiliário/Equipamentos'
)
UPDATE perigos_catalogo p
SET numero = r.novo_numero
FROM ranked r
WHERE p.id = r.id;
"
echo -e "${GREEN}✓ Mobiliário/Equipamentos: 1-17${NC}"
echo ""

# 3. ORGANIZAÇÃO/COGNITIVO/PSICOSSOCIAL
echo -e "${BLUE}3/4${NC} ${YELLOW}Organização/Cognitivo/Psicossocial...${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY numero) as novo_numero
    FROM perigos_catalogo
    WHERE categoria = 'Organização/Cognitivo/Psicossocial'
)
UPDATE perigos_catalogo p
SET numero = r.novo_numero + 10000
FROM ranked r
WHERE p.id = r.id;

WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY numero) as novo_numero
    FROM perigos_catalogo
    WHERE categoria = 'Organização/Cognitivo/Psicossocial'
)
UPDATE perigos_catalogo p
SET numero = r.novo_numero
FROM ranked r
WHERE p.id = r.id;
"
echo -e "${GREEN}✓ Organização/Cognitivo/Psicossocial: 1-20${NC}"
echo ""

# 4. CONDIÇÕES FÍSICAS/AMBIENTAIS
echo -e "${BLUE}4/4${NC} ${YELLOW}Condições Físicas/Ambientais...${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY numero) as novo_numero
    FROM perigos_catalogo
    WHERE categoria = 'Condições Físicas/Ambientais'
)
UPDATE perigos_catalogo p
SET numero = r.novo_numero + 10000
FROM ranked r
WHERE p.id = r.id;

WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY numero) as novo_numero
    FROM perigos_catalogo
    WHERE categoria = 'Condições Físicas/Ambientais'
)
UPDATE perigos_catalogo p
SET numero = r.novo_numero
FROM ranked r
WHERE p.id = r.id;
"
echo -e "${GREEN}✓ Condições Físicas/Ambientais: 1-8${NC}"
echo ""

# Recriar constraint
echo -e "${YELLOW}Recriando constraint...${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
ALTER TABLE perigos_catalogo ADD CONSTRAINT perigos_catalogo_categoria_numero_key UNIQUE (categoria, numero);
"
echo ""

# VERIFICAÇÃO FINAL
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  VERIFICAÇÃO FINAL${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}Biomecânicos:${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 40) as descricao FROM perigos_catalogo WHERE categoria = 'Biomecânicos' ORDER BY numero LIMIT 3;
"

echo ""
echo -e "${YELLOW}Mobiliário/Equipamentos:${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 40) as descricao FROM perigos_catalogo WHERE categoria = 'Mobiliário/Equipamentos' ORDER BY numero LIMIT 3;
"

echo ""
echo -e "${YELLOW}Organização/Cognitivo/Psicossocial:${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 40) as descricao FROM perigos_catalogo WHERE categoria = 'Organização/Cognitivo/Psicossocial' ORDER BY numero LIMIT 3;
"

echo ""
echo -e "${YELLOW}Condições Físicas/Ambientais:${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 40) as descricao FROM perigos_catalogo WHERE categoria = 'Condições Físicas/Ambientais' ORDER BY numero LIMIT 3;
"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  TODOS devem mostrar 1, 2, 3...${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
