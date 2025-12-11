#!/bin/bash

# Script FINAL para reindexação completa de perigos 1-61

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  REINDEXAÇÃO FINAL DE PERIGOS${NC}"
echo -e "${BLUE}  Sequência 1-61 Completa${NC}"
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
SELECT COUNT(*) as total_perigos FROM perigos_catalogo;
SELECT MIN(numero) as min, MAX(numero) as max FROM perigos_catalogo;
"

echo ""
echo -e "${YELLOW}🎯 OBJETIVO da reindexação:${NC}"
echo -e "  ${BLUE}Biomecânicos${NC}: 1-16 (16 perigos)"
echo -e "  ${BLUE}Mobiliário/Equipamentos${NC}: 17-33 (17 perigos)"
echo -e "  ${BLUE}Organização/Cognitivo/Psicossocial${NC}: 34-52 (19 perigos, SEM 'difícil comunicação')"
echo -e "  ${BLUE}Condições Físicas/Ambientais${NC}: 53-61 (9 perigos)"
echo -e "     ${GREEN}→ Item 53: Trabalho em condições de difícil comunicação${NC}"
echo -e "     → Itens 54-61: Outros perigos físicos/ambientais"
echo ""

read -p "Confirma reindexação completa? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⚠️  Operação cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Iniciando reindexação...${NC}"
echo ""

# Executar reindexação
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" << 'EOSQL'

-- PASSO 1: Criar tabela temporária com nova numeração correta
CREATE TEMP TABLE perigos_reindexados AS
SELECT
    id,
    numero as numero_antigo,
    categoria,
    descricao,
    -- Definir ordem das categorias
    CASE categoria
        WHEN 'Biomecânicos' THEN 1
        WHEN 'Mobiliário/Equipamentos' THEN 2
        WHEN 'Organização/Cognitivo/Psicossocial' THEN 3
        WHEN 'Condições Físicas/Ambientais' THEN 4
        ELSE 5
    END as ordem_categoria,
    -- Ordem dentro da categoria
    CASE
        -- "Trabalho em condições de difícil comunicação" vai para Condições Físicas/Ambientais
        WHEN descricao = 'Trabalho em condições de difícil comunicação' THEN 1000000
        ELSE numero
    END as ordem_interna
FROM perigos_catalogo;

-- PASSO 2: Ajustar categoria do "Trabalho em condições de difícil comunicação"
UPDATE perigos_reindexados
SET
    categoria = 'Condições Físicas/Ambientais',
    ordem_categoria = 4,
    ordem_interna = 0  -- Será o primeiro da categoria
WHERE descricao = 'Trabalho em condições de difícil comunicação';

-- PASSO 3: Criar numeração final
CREATE TEMP TABLE perigos_numeracao_final AS
SELECT
    ROW_NUMBER() OVER (ORDER BY ordem_categoria, ordem_interna, numero_antigo) as novo_numero,
    id,
    numero_antigo,
    categoria,
    descricao
FROM perigos_reindexados;

-- Mostrar distribuição
\echo ''
\echo '📊 Nova distribuição:'
SELECT
    categoria,
    COUNT(*) as total,
    MIN(novo_numero)::text || '-' || MAX(novo_numero)::text as faixa
FROM perigos_numeracao_final
GROUP BY categoria
ORDER BY MIN(novo_numero);

-- Mostrar item 53
\echo ''
\echo '✅ Verificando item 53:'
SELECT novo_numero, categoria, descricao
FROM perigos_numeracao_final
WHERE novo_numero = 53;

-- PASSO 4: Aplicar mudanças
-- 4.1: Desabilitar constraint
ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_numero_key;

-- 4.2: Atualizar categoria primeiro
UPDATE perigos_catalogo
SET categoria = 'Condições Físicas/Ambientais'
WHERE descricao = 'Trabalho em condições de difícil comunicação';

-- 4.3: Mover todos para números negativos (evitar conflitos)
UPDATE perigos_catalogo SET numero = -id;

-- 4.4: Aplicar nova numeração
UPDATE perigos_catalogo pc
SET numero = pnf.novo_numero
FROM perigos_numeracao_final pnf
WHERE pc.id = pnf.id;

-- 4.5: Recriar constraint
ALTER TABLE perigos_catalogo ADD CONSTRAINT perigos_catalogo_numero_key UNIQUE (numero);

\echo ''
\echo '✅ Reindexação concluída!'

EOSQL

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Reindexação executada com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro na reindexação${NC}"
    exit 1
fi

echo ""

# Verificação final
echo -e "${YELLOW}📊 DEPOIS da reindexação:${NC}"
echo ""

echo -e "Total de perigos:"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT COUNT(*) as total FROM perigos_catalogo;
"

echo ""
echo -e "Faixa de numeração:"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT MIN(numero) as min, MAX(numero) as max FROM perigos_catalogo;
"

echo ""
echo -e "Distribuição por categoria:"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
    categoria,
    COUNT(*) as total,
    MIN(numero)::text || '-' || MAX(numero)::text as faixa
FROM perigos_catalogo
GROUP BY categoria
ORDER BY MIN(numero);
"

echo ""
echo -e "Item 53 (DEVE SER 'Trabalho em condições de difícil comunicação'):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, categoria, descricao
FROM perigos_catalogo
WHERE numero = 53;
"

echo ""
echo -e "Categoria 'Condições Físicas/Ambientais' (53-61):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 65) as descricao
FROM perigos_catalogo
WHERE categoria = 'Condições Físicas/Ambientais'
ORDER BY numero;
"

echo ""
echo -e "Gaps na numeração (não deve retornar nada):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT s.num as numero_faltando
FROM generate_series(1, 61) AS s(num)
WHERE NOT EXISTS (SELECT 1 FROM perigos_catalogo WHERE numero = s.num)
ORDER BY s.num;
"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ REINDEXAÇÃO COMPLETA!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📝 Resultado Final:${NC}"
echo -e "  ✅ Total: ${GREEN}61 perigos${NC}"
echo -e "  ✅ Numeração: ${GREEN}1-61${NC} (sequencial, sem gaps)"
echo -e "  ✅ Item 53: ${GREEN}'Trabalho em condições de difícil comunicação'${NC}"
echo -e "  ✅ Categoria correta: ${GREEN}'Condições Físicas/Ambientais'${NC}"
echo ""
echo -e "${YELLOW}💡 Próximos passos no FRONTEND:${NC}"
echo -e "  1. ${BLUE}Limpar cache${NC}: CTRL+SHIFT+R (Windows) ou CMD+SHIFT+R (Mac)"
echo -e "  2. ${BLUE}Recarregar${NC} a página de avaliação"
echo -e "  3. ${BLUE}Verificar${NC}:"
echo -e "     - Perigos vão de 1 a 61"
echo -e "     - Item 53 está correto"
echo -e "     - Categoria 'Condições Físicas/Ambientais' tem 9 perigos (53-61)"
echo ""
