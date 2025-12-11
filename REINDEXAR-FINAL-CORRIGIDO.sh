#!/bin/bash

# Script FINAL CORRIGIDO para reindexação por categoria

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  REINDEXAÇÃO POR CATEGORIA - FINAL${NC}"
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

echo -e "${YELLOW}📊 ANTES da reindexação:${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT categoria, MIN(numero) || '-' || MAX(numero) as faixa
FROM perigos_catalogo
GROUP BY categoria
ORDER BY MIN(numero);
"

echo ""
read -p "Confirma reindexação por categoria (1,2,3... em cada)? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⚠️  Cancelado${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Executando reindexação...${NC}"
echo ""

# Executar SQL CORRIGIDO (sem usar -id, usando números temporários altos)
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" << 'EOSQL'

-- Remover constraints
ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_numero_key;
ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_categoria_numero_key;

-- Criar tabela temporária com nova numeração
CREATE TEMP TABLE reindex_mapping AS
SELECT
    id,
    categoria,
    numero as numero_antigo,
    ROW_NUMBER() OVER (PARTITION BY categoria ORDER BY numero) as numero_novo
FROM perigos_catalogo;

-- Mostrar mapeamento de exemplo
\echo 'Exemplos de renumeração:'
SELECT categoria, numero_antigo, numero_novo, LEFT(descricao, 40) as descricao
FROM reindex_mapping r
JOIN perigos_catalogo p ON r.id = p.id
WHERE numero_novo <= 3
ORDER BY categoria, numero_novo;

-- Primeiro: mover todos para números altos temporários (1000+)
UPDATE perigos_catalogo p
SET numero = 1000 + (SELECT ROW_NUMBER() OVER (ORDER BY id) FROM perigos_catalogo WHERE id = p.id);

-- Segundo: aplicar a nova numeração
UPDATE perigos_catalogo p
SET numero = (SELECT numero_novo FROM reindex_mapping WHERE id = p.id);

-- Recriar constraint
ALTER TABLE perigos_catalogo ADD CONSTRAINT perigos_catalogo_categoria_numero_key UNIQUE (categoria, numero);

\echo ''
\echo 'Verificação da nova numeração:'
SELECT categoria, COUNT(*) as total, MIN(numero) || '-' || MAX(numero) as faixa_nova
FROM perigos_catalogo
GROUP BY categoria
ORDER BY
    CASE categoria
        WHEN 'Biomecânicos' THEN 1
        WHEN 'Mobiliário/Equipamentos' THEN 2
        WHEN 'Organização/Cognitivo/Psicossocial' THEN 3
        WHEN 'Condições Físicas/Ambientais' THEN 4
    END;

EOSQL

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Reindexação executada!${NC}"
else
    echo -e "${RED}❌ Erro na reindexação${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📊 VERIFICAÇÃO FINAL:${NC}"
echo ""

echo -e "1. Biomecânicos (deve ser 1-16):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 50) as descricao
FROM perigos_catalogo
WHERE categoria = 'Biomecânicos'
ORDER BY numero
LIMIT 3;
"

echo ""
echo -e "2. Mobiliário/Equipamentos (deve ser 1-17):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 50) as descricao
FROM perigos_catalogo
WHERE categoria = 'Mobiliário/Equipamentos'
ORDER BY numero
LIMIT 3;
"

echo ""
echo -e "3. Organização/Cognitivo/Psicossocial (deve ser 1-20):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 50) as descricao
FROM perigos_catalogo
WHERE categoria = 'Organização/Cognitivo/Psicossocial'
ORDER BY numero
LIMIT 3;
"

echo ""
echo -e "4. Condições Físicas/Ambientais (deve ser 1-8):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 50) as descricao
FROM perigos_catalogo
WHERE categoria = 'Condições Físicas/Ambientais'
ORDER BY numero;
"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ VERIFICAR SE:${NC}"
echo -e "${GREEN}  - Biomecânicos: 1, 2, 3...${NC}"
echo -e "${GREEN}  - Mobiliário: 1, 2, 3...${NC}"
echo -e "${GREEN}  - Organização: 1, 2, 3...${NC}"
echo -e "${GREEN}  - Condições Físicas: 1, 2, 3...${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Se os números estiverem corretos:${NC}"
echo -e "  ${BLUE}CTRL+SHIFT+R no navegador${NC}"
echo ""
