#!/bin/bash

# Script para reindexar perigos com "Trabalho em condições de difícil comunicação" como item 53

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  Reindexação de Perigos${NC}"
echo -e "${BLUE}  Item 53: Difícil Comunicação${NC}"
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
echo -e "${YELLOW}📊 Estado atual:${NC}"
echo ""
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT COUNT(*) as total FROM perigos_catalogo;
"

echo ""
echo -e "${YELLOW}🔧 Operação:${NC}"
echo -e "  1. ${BLUE}Biomecânicos${NC}: 1-16 (16 perigos)"
echo -e "  2. ${BLUE}Mobiliário/Equipamentos${NC}: 17-33 (17 perigos)"
echo -e "  3. ${BLUE}Organização/Cognitivo/Psicossocial${NC}: 34-52 (19 perigos)"
echo -e "  4. ${BLUE}Condições Físicas/Ambientais${NC}: 53-61 (9 perigos)"
echo -e "     ${GREEN}→ Item 53: Trabalho em condições de difícil comunicação${NC}"
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

-- Criar tabela temporária com nova numeração
CREATE TEMP TABLE perigos_nova_numeracao AS
WITH perigos_ordenados AS (
    SELECT
        id,
        numero as numero_antigo,
        categoria,
        descricao,
        CASE categoria
            WHEN 'Biomecânicos' THEN 1
            WHEN 'Mobiliário/Equipamentos' THEN 2
            WHEN 'Organização/Cognitivo/Psicossocial' THEN 3
            WHEN 'Condições Físicas/Ambientais' THEN 4
            ELSE 5
        END as ordem_categoria,
        -- Dar prioridade especial para "difícil comunicação" ser o primeiro em Condições Físicas
        CASE
            WHEN descricao = 'Trabalho em condições de difícil comunicação'
                AND categoria = 'Condições Físicas/Ambientais' THEN 0
            ELSE numero
        END as ordem_dentro_categoria
    FROM perigos_catalogo
)
SELECT
    ROW_NUMBER() OVER (
        ORDER BY ordem_categoria, ordem_dentro_categoria, numero_antigo
    ) as novo_numero,
    id,
    numero_antigo,
    categoria,
    descricao
FROM perigos_ordenados;

-- Mostrar item 53
\echo ''
\echo '✅ Verificando item 53:'
SELECT novo_numero, LEFT(descricao, 60) as descricao, categoria
FROM perigos_nova_numeracao
WHERE novo_numero = 53;

-- Mostrar distribuição
\echo ''
\echo '📊 Distribuição por categoria:'
SELECT
    categoria,
    COUNT(*) as total,
    MIN(novo_numero) || '-' || MAX(novo_numero) as faixa
FROM perigos_nova_numeracao
GROUP BY categoria
ORDER BY MIN(novo_numero);

-- Desabilitar constraint
ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_numero_key;

-- Mover para números temporários
UPDATE perigos_catalogo SET numero = -id;

-- Aplicar nova numeração
UPDATE perigos_catalogo pc
SET numero = pn.novo_numero
FROM perigos_nova_numeracao pn
WHERE pc.id = pn.id;

-- Recriar constraint
ALTER TABLE perigos_catalogo ADD CONSTRAINT perigos_catalogo_numero_key UNIQUE (numero);

\echo ''
\echo '✅ Reindexação concluída!'

EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Reindexação executada com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro na reindexação${NC}"
    exit 1
fi

echo ""

# Verificar resultado
echo -e "${YELLOW}📊 Verificação final:${NC}"
echo ""

echo -e "Total de perigos:"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT COUNT(*) as total FROM perigos_catalogo;
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
echo -e "Item 53 (deve ser 'Trabalho em condições de difícil comunicação'):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, descricao, categoria
FROM perigos_catalogo
WHERE numero = 53;
"

echo ""
echo -e "Categoria 'Condições Físicas/Ambientais' (53-61):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 60) as descricao
FROM perigos_catalogo
WHERE categoria = 'Condições Físicas/Ambientais'
ORDER BY numero;
"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Reindexação Concluída!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📝 Resultado:${NC}"
echo -e "  - Total: ${GREEN}61 perigos${NC}"
echo -e "  - Numeração: ${GREEN}1 a 61${NC} (sequencial)"
echo -e "  - Item 53: ${GREEN}Trabalho em condições de difícil comunicação${NC}"
echo ""
echo -e "${YELLOW}📋 Distribuição:${NC}"
echo -e "  - Biomecânicos: 1-16 (16 perigos)"
echo -e "  - Mobiliário/Equipamentos: 17-33 (17 perigos)"
echo -e "  - Organização/Cognitivo/Psicossocial: 34-52 (19 perigos)"
echo -e "  - Condições Físicas/Ambientais: 53-61 (9 perigos)"
echo ""
echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo -e "  1. Limpar cache do navegador (CTRL+SHIFT+R)"
echo -e "  2. Recarregar página de avaliação"
echo -e "  3. Verificar item 53 está correto"
echo ""
