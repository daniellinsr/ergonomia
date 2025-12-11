#!/bin/bash

# Script para reindexar perigos por categoria (numeração independente)

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  REINDEXAÇÃO POR CATEGORIA${NC}"
echo -e "${BLUE}  Numeração Independente${NC}"
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
SELECT
    categoria,
    COUNT(*) as total,
    MIN(numero)::text || '-' || MAX(numero)::text as faixa_atual
FROM perigos_catalogo
GROUP BY categoria
ORDER BY MIN(numero);
"

echo ""
echo -e "${YELLOW}🎯 OBJETIVO:${NC}"
echo -e "  ${BLUE}Cada categoria terá numeração INDEPENDENTE${NC}"
echo -e ""
echo -e "  ${GREEN}Biomecânicos${NC}: 1-16 (16 perigos)"
echo -e "  ${GREEN}Mobiliário/Equipamentos${NC}: 1-17 (17 perigos)"
echo -e "  ${GREEN}Organização/Cognitivo/Psicossocial${NC}: 1-19 (19 perigos)"
echo -e "  ${GREEN}Condições Físicas/Ambientais${NC}: 1-9 (9 perigos)"
echo ""

read -p "Confirma a reindexação por categoria? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⚠️  Operação cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Executando reindexação...${NC}"
echo ""

# Executar reindexação
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" << 'EOSQL'

BEGIN;

-- Criar tabela temporária com nova numeração por categoria
CREATE TEMP TABLE perigos_nova_numeracao AS
SELECT
    id,
    numero as numero_antigo,
    categoria,
    descricao,
    ROW_NUMBER() OVER (
        PARTITION BY categoria
        ORDER BY numero
    ) as novo_numero
FROM perigos_catalogo;

-- Desabilitar constraints
ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_numero_key;
ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_categoria_numero_key;

-- Mover para números negativos
UPDATE perigos_catalogo SET numero = -id;

-- Aplicar nova numeração
UPDATE perigos_catalogo pc
SET numero = pnn.novo_numero
FROM perigos_nova_numeracao pnn
WHERE pc.id = pnn.id;

-- Criar constraint composta (categoria + numero deve ser único)
ALTER TABLE perigos_catalogo
    ADD CONSTRAINT perigos_catalogo_categoria_numero_key UNIQUE (categoria, numero);

\echo ''
\echo '✅ Reindexação por categoria concluída!'
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

# Verificação
echo -e "${YELLOW}📊 DEPOIS da reindexação:${NC}"
echo ""

echo -e "Distribuição por categoria (nova numeração):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
    categoria,
    COUNT(*) as total,
    MIN(numero)::text || '-' || MAX(numero)::text as faixa
FROM perigos_catalogo
GROUP BY categoria
ORDER BY
    CASE categoria
        WHEN 'Biomecânicos' THEN 1
        WHEN 'Mobiliário/Equipamentos' THEN 2
        WHEN 'Organização/Cognitivo/Psicossocial' THEN 3
        WHEN 'Condições Físicas/Ambientais' THEN 4
        ELSE 5
    END;
"

echo ""
echo -e "Exemplos de cada categoria:"
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
        ELSE 5
    END,
    numero;
"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ REINDEXAÇÃO CONCLUÍDA!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📝 Resultado:${NC}"
echo -e "  ✅ Cada categoria tem numeração independente (1, 2, 3...)"
echo -e "  ✅ Biomecânicos: 1-16"
echo -e "  ✅ Mobiliário/Equipamentos: 1-17"
echo -e "  ✅ Organização/Cognitivo/Psicossocial: 1-19"
echo -e "  ✅ Condições Físicas/Ambientais: 1-9"
echo ""
echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo -e "  1. ${BLUE}Frontend será atualizado automaticamente${NC}"
echo -e "  2. ${BLUE}Limpar cache do navegador: CTRL+SHIFT+R${NC}"
echo -e "  3. ${BLUE}Verificar que cada categoria mostra 1, 2, 3...${NC}"
echo ""
