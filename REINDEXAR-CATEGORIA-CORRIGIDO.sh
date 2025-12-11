#!/bin/bash

# Script CORRIGIDO para reindexar perigos por categoria

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  REINDEXAÇÃO POR CATEGORIA (CORRIGIDO)${NC}"
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
echo -e "${YELLOW}🔍 Verificando PostgreSQL...${NC}"
POSTGRES_CONTAINER=$(docker ps --filter "name=ergonomia_postgres" --format "{{.Names}}" | grep -v backup | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo -e "${RED}❌ Erro: Container PostgreSQL não encontrado!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL encontrado: $POSTGRES_CONTAINER${NC}"
echo ""

# Estado atual
echo -e "${YELLOW}📊 ANTES da reindexação:${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT categoria, COUNT(*) as total, MIN(numero) || '-' || MAX(numero) as faixa
FROM perigos_catalogo
GROUP BY categoria
ORDER BY MIN(numero);
"

echo ""
echo -e "${YELLOW}🎯 Confirma reindexação por categoria?${NC}"
echo -e "  Cada categoria terá numeração 1, 2, 3..."
echo ""

read -p "Continuar? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⚠️  Operação cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Executando reindexação...${NC}"
echo ""

# Executar reindexação CORRIGIDA
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" << 'EOSQL'

BEGIN;

-- Remover constraints
ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_numero_key;
ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_categoria_numero_key;

-- Criar tabela temporária com a nova numeração POR CATEGORIA
CREATE TEMP TABLE temp_reindex AS
SELECT
    id,
    categoria,
    descricao,
    numero as numero_antigo,
    ROW_NUMBER() OVER (
        PARTITION BY categoria
        ORDER BY
            CASE categoria
                WHEN 'Biomecânicos' THEN numero
                WHEN 'Mobiliário/Equipamentos' THEN numero
                WHEN 'Organização/Cognitivo/Psicossocial' THEN numero
                WHEN 'Condições Físicas/Ambientais' THEN
                    -- "Trabalho em condições de difícil comunicação" deve ser o primeiro
                    CASE WHEN descricao = 'Trabalho em condições de difícil comunicação' THEN 0
                    ELSE numero
                    END
            END
    ) as numero_novo
FROM perigos_catalogo;

-- Mostrar preview
\echo ''
\echo 'Preview da nova numeração:'
\echo ''
SELECT categoria, numero_novo, LEFT(descricao, 50) as descricao
FROM temp_reindex
WHERE numero_novo <= 3
ORDER BY
    CASE categoria
        WHEN 'Biomecânicos' THEN 1
        WHEN 'Mobiliário/Equipamentos' THEN 2
        WHEN 'Organização/Cognitivo/Psicossocial' THEN 3
        WHEN 'Condições Físicas/Ambientais' THEN 4
    END,
    numero_novo;

-- Aplicar numeração
-- Primeiro mover todos para negativos
UPDATE perigos_catalogo SET numero = -id;

-- Depois aplicar a nova numeração
UPDATE perigos_catalogo p
SET numero = t.numero_novo
FROM temp_reindex t
WHERE p.id = t.id;

-- Criar constraint única por (categoria, numero)
ALTER TABLE perigos_catalogo
    ADD CONSTRAINT perigos_catalogo_categoria_numero_key
    UNIQUE (categoria, numero);

\echo ''
\echo '✅ Reindexação concluída!'
\echo ''

COMMIT;

EOSQL

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Reindexação executada com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro na reindexação${NC}"
    exit 1
fi

echo ""

# Verificação DETALHADA
echo -e "${YELLOW}📊 DEPOIS da reindexação:${NC}"
echo ""

echo -e "1. Distribuição por categoria:"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT categoria, COUNT(*) as total, MIN(numero) || '-' || MAX(numero) as faixa
FROM perigos_catalogo
GROUP BY categoria
ORDER BY
    CASE categoria
        WHEN 'Biomecânicos' THEN 1
        WHEN 'Mobiliário/Equipamentos' THEN 2
        WHEN 'Organização/Cognitivo/Psicossocial' THEN 3
        WHEN 'Condições Físicas/Ambientais' THEN 4
    END;
"

echo ""
echo -e "2. Primeiros 3 de cada categoria:"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT categoria, numero, LEFT(descricao, 50) as descricao
FROM perigos_catalogo
WHERE numero <= 3
ORDER BY
    CASE categoria
        WHEN 'Biomecânicos' THEN 1
        WHEN 'Mobiliário/Equipamentos' THEN 2
        WHEN 'Organização/Cognitivo/Psicossocial' THEN 3
        WHEN 'Condições Físicas/Ambientais' THEN 4
    END,
    numero;
"

echo ""
echo -e "3. Verificar categoria 'Mobiliário/Equipamentos' (deve ser 1-17):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 60) as descricao
FROM perigos_catalogo
WHERE categoria = 'Mobiliário/Equipamentos'
ORDER BY numero
LIMIT 5;
"

echo ""
echo -e "4. Verificar categoria 'Condições Físicas/Ambientais' (deve ser 1-9):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 60) as descricao
FROM perigos_catalogo
WHERE categoria = 'Condições Físicas/Ambientais'
ORDER BY numero;
"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ REINDEXAÇÃO COMPLETA!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📝 Agora cada categoria tem numeração 1, 2, 3...${NC}"
echo ""
echo -e "${RED}IMPORTANTE: Limpe o cache do navegador!${NC}"
echo -e "  CTRL+SHIFT+R e recarregue a página"
echo ""
