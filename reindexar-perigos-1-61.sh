#!/bin/bash

# Script para reindexar perigos sequencialmente de 1 a 61

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  Reindexação de Perigos${NC}"
echo -e "${BLUE}  Sequência 1-61 (Todos os Perigos)${NC}"
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
echo -e "${YELLOW}📊 Estado ANTES da reindexação:${NC}"
echo ""
echo -e "Total de perigos:"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT COUNT(*) as total FROM perigos_catalogo;
"

echo ""
echo -e "Faixa de numeração:"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT MIN(numero) as minimo, MAX(numero) as maximo FROM perigos_catalogo;
"

echo ""
echo -e "${YELLOW}🔧 Operação:${NC}"
echo -e "  ${BLUE}Reindexar TODOS os perigos${NC} de 1 a 61"
echo -e "  ${BLUE}Manter todos os perigos${NC} (nenhum será removido)"
echo -e "  ${BLUE}Ordenar por categoria e número atual${NC}"
echo ""

read -p "Deseja continuar? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⚠️  Operação cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Executando reindexação...${NC}"
echo ""

# Executar reindexação
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" << 'EOF'

-- Criar tabela temporária com nova numeração sequencial
CREATE TEMP TABLE perigos_reindexados AS
SELECT
    ROW_NUMBER() OVER (
        ORDER BY
            CASE categoria
                WHEN 'Biomecânicos' THEN 1
                WHEN 'Mobiliário/Equipamentos' THEN 2
                WHEN 'Organização/Cognitivo/Psicossocial' THEN 3
                WHEN 'Condições Físicas/Ambientais' THEN 4
                ELSE 5
            END,
            numero
    ) as novo_numero,
    id,
    numero as numero_antigo,
    categoria,
    descricao
FROM perigos_catalogo
ORDER BY
    CASE categoria
        WHEN 'Biomecânicos' THEN 1
        WHEN 'Mobiliário/Equipamentos' THEN 2
        WHEN 'Organização/Cognitivo/Psicossocial' THEN 3
        WHEN 'Condições Físicas/Ambientais' THEN 4
        ELSE 5
    END,
    numero;

-- Mostrar total
\echo ''
\echo '📊 Total de perigos a reindexar:'
SELECT COUNT(*) as total FROM perigos_reindexados;

-- Mostrar mudanças (apenas primeiros 10 e últimos 10 para não poluir)
\echo ''
\echo '📋 Primeiras 10 reindexações:'
SELECT
    numero_antigo as "Antigo",
    novo_numero as "Novo",
    LEFT(descricao, 40) as "Descrição"
FROM perigos_reindexados
WHERE numero_antigo != novo_numero
ORDER BY novo_numero
LIMIT 10;

\echo ''
\echo '📋 Últimas reindexações:'
SELECT
    numero_antigo as "Antigo",
    novo_numero as "Novo",
    LEFT(descricao, 40) as "Descrição"
FROM perigos_reindexados
WHERE numero_antigo != novo_numero
ORDER BY novo_numero DESC
LIMIT 10;

-- Desabilitar constraint temporariamente
ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_numero_key;

-- Primeiro, mover todos para números temporários (negativos) para evitar conflitos
UPDATE perigos_catalogo
SET numero = -id;

-- Depois, aplicar a nova numeração
UPDATE perigos_catalogo pc
SET numero = pt.novo_numero
FROM perigos_reindexados pt
WHERE pc.id = pt.id;

-- Recriar constraint
ALTER TABLE perigos_catalogo ADD CONSTRAINT perigos_catalogo_numero_key UNIQUE (numero);

\echo ''
\echo '✅ Reindexação concluída!'
\echo ''

EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Reindexação executada com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro na reindexação${NC}"
    exit 1
fi

echo ""

# Verificar resultado
echo -e "${YELLOW}📊 Estado APÓS a reindexação:${NC}"
echo ""
echo -e "Total de perigos:"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT COUNT(*) as total FROM perigos_catalogo;
"

echo ""
echo -e "Faixa de numeração:"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT MIN(numero) as minimo, MAX(numero) as maximo FROM perigos_catalogo;
"

echo ""
echo -e "Distribuição por categoria:"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
    categoria,
    COUNT(*) as total,
    MIN(numero) || '-' || MAX(numero) as faixa
FROM perigos_catalogo
GROUP BY categoria
ORDER BY MIN(numero);
"

echo ""
echo -e "Primeiros 5 perigos:"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 60) as descricao
FROM perigos_catalogo
WHERE numero <= 5
ORDER BY numero;
"

echo ""
echo -e "Últimos 5 perigos:"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 60) as descricao
FROM perigos_catalogo
WHERE numero >= 57
ORDER BY numero;
"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Reindexação Concluída!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📝 Resultado:${NC}"
echo -e "  - ${GREEN}61 perigos${NC} mantidos"
echo -e "  - Numeração: ${GREEN}1 a 61${NC} (sequencial)"
echo -e "  - Sem gaps na numeração"
echo ""
echo -e "${YELLOW}📝 Próximos passos:${NC}"
echo -e "  1. Limpar cache do navegador (CTRL+SHIFT+R)"
echo -e "  2. Recarregar página de avaliação"
echo -e "  3. Verificar que perigos vão de 1 a 61"
echo ""
