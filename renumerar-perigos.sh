#!/bin/bash

# Script para renumerar perigos de 1-60 sequencialmente

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  Renumeração de Perigos${NC}"
echo -e "${BLUE}  Sequência 1-60 (Sem Duplicação)${NC}"
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
echo -e "${YELLOW}📊 Estado ANTES da renumeração:${NC}"
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
echo -e "Perigos duplicados (se houver):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT descricao, COUNT(*) as total
FROM perigos_catalogo
GROUP BY descricao
HAVING COUNT(*) > 1;
"

echo ""
echo -e "${YELLOW}🔧 Operação a ser realizada:${NC}"
echo -e "  1. ${BLUE}Remover perigo 61 duplicado${NC} (se existir)"
echo -e "  2. ${BLUE}Renumerar perigos${NC} para sequência 1-60"
echo -e "  3. ${BLUE}Garantir sem gaps${NC} na numeração"
echo ""

read -p "Deseja continuar? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⚠️  Operação cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Executando renumeração...${NC}"
echo ""

# Executar renumeração
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" << 'EOF'

-- Criar tabela temporária com nova numeração
CREATE TEMP TABLE perigos_renumerados AS
SELECT
    ROW_NUMBER() OVER (ORDER BY numero) as novo_numero,
    id,
    numero as numero_antigo,
    categoria,
    descricao
FROM perigos_catalogo
WHERE NOT (
    numero = 61
    AND descricao = 'Trabalho em condições de difícil comunicação'
    AND categoria = 'Condições Físicas/Ambientais'
)
ORDER BY numero;

-- Mostrar mapeamento
\echo ''
\echo '📋 Mapeamento de renumeração (apenas mudanças):'
\echo ''
SELECT
    numero_antigo as "Número Antigo",
    novo_numero as "Número Novo",
    LEFT(descricao, 50) as "Descrição"
FROM perigos_renumerados
WHERE numero_antigo != novo_numero
ORDER BY numero_antigo;

-- Desabilitar constraint temporariamente
ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_numero_key;

-- Atualizar números
UPDATE perigos_catalogo pc
SET numero = pt.novo_numero
FROM perigos_renumerados pt
WHERE pc.id = pt.id;

-- Remover duplicado
DELETE FROM perigos_catalogo
WHERE numero > 60
   OR (numero = 61
       AND descricao = 'Trabalho em condições de difícil comunicação'
       AND categoria = 'Condições Físicas/Ambientais');

-- Recriar constraint
ALTER TABLE perigos_catalogo ADD CONSTRAINT perigos_catalogo_numero_key UNIQUE (numero);

\echo ''
\echo '✅ Renumeração concluída!'
\echo ''

EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Renumeração executada com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro na renumeração${NC}"
    exit 1
fi

echo ""

# Verificar resultado
echo -e "${YELLOW}📊 Estado APÓS a renumeração:${NC}"
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
echo -e "Gaps na numeração (não deve retornar nada):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT s.num as numero_faltando
FROM generate_series(1, 60) AS s(num)
WHERE NOT EXISTS (
    SELECT 1 FROM perigos_catalogo WHERE numero = s.num
);
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
echo -e "Últimos 5 perigos (55-60):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 60) as descricao
FROM perigos_catalogo
WHERE numero >= 55
ORDER BY numero;
"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Renumeração Concluída!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📝 Próximos passos:${NC}"
echo -e "  1. Limpar cache do navegador (CTRL+SHIFT+R)"
echo -e "  2. Recarregar página de avaliação"
echo -e "  3. Verificar que perigos vão de 1 a 60"
echo -e "  4. Item 61 não deve mais aparecer"
echo ""
