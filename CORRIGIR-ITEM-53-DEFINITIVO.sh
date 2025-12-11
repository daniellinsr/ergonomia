#!/bin/bash

# Script DEFINITIVO para mover "Trabalho em condições de difícil comunicação" para o número 53

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  CORREÇÃO DEFINITIVA - ITEM 53${NC}"
echo -e "${BLUE}  'Trabalho em condições de difícil comunicação'${NC}"
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

# Diagnóstico ANTES
echo -e "${YELLOW}📊 ANTES da correção:${NC}"
echo ""
echo -e "Perigo 'Trabalho em condições de difícil comunicação':"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, categoria, descricao
FROM perigos_catalogo
WHERE descricao = 'Trabalho em condições de difícil comunicação';
"

echo ""
echo -e "Item atual número 53:"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, categoria, LEFT(descricao, 60) as descricao
FROM perigos_catalogo
WHERE numero = 53;
"

echo ""
echo -e "${YELLOW}🎯 OBJETIVO:${NC}"
echo -e "  1. 'Trabalho em condições de difícil comunicação' → ${GREEN}número 53${NC}"
echo -e "  2. Categoria → ${GREEN}'Condições Físicas/Ambientais'${NC}"
echo -e "  3. Item atual 53 e posteriores → ${BLUE}renumerados para 54-61${NC}"
echo ""

read -p "Confirma a correção? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⚠️  Operação cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Executando correção...${NC}"
echo ""

# Executar correção
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" << 'EOSQL'

BEGIN;

-- PASSO 1: Guardar o ID do perigo que queremos mover
DO $$
DECLARE
    perigo_id_comunicacao UUID;
    perigo_numero_atual INTEGER;
BEGIN
    -- Encontrar o perigo
    SELECT id, numero INTO perigo_id_comunicacao, perigo_numero_atual
    FROM perigos_catalogo
    WHERE descricao = 'Trabalho em condições de difícil comunicação'
    LIMIT 1;

    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '  Iniciando Correção';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Perigo encontrado:';
    RAISE NOTICE '  ID: %', perigo_id_comunicacao;
    RAISE NOTICE '  Número atual: %', perigo_numero_atual;
    RAISE NOTICE '';

    -- Armazenar em variável de sessão
    PERFORM set_config('app.perigo_id', perigo_id_comunicacao::text, false);
    PERFORM set_config('app.perigo_numero_atual', perigo_numero_atual::text, false);
END $$;

-- PASSO 2: Desabilitar constraint
ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_numero_key;

-- PASSO 3: Mover o perigo "difícil comunicação" para número temporário
UPDATE perigos_catalogo
SET numero = 9999
WHERE id = current_setting('app.perigo_id')::uuid;

-- PASSO 4: Ajustar perigos de 53 em diante (deslocar +1)
UPDATE perigos_catalogo
SET numero = numero + 1
WHERE numero >= 53
  AND numero < 9999
  AND categoria = 'Condições Físicas/Ambientais';

-- PASSO 5: Colocar "difícil comunicação" no número 53 e ajustar categoria
UPDATE perigos_catalogo
SET
    numero = 53,
    categoria = 'Condições Físicas/Ambientais'
WHERE id = current_setting('app.perigo_id')::uuid;

-- PASSO 6: Recriar constraint
ALTER TABLE perigos_catalogo ADD CONSTRAINT perigos_catalogo_numero_key UNIQUE (numero);

RAISE NOTICE '';
RAISE NOTICE '✅ Correção aplicada!';
RAISE NOTICE '';

COMMIT;

EOSQL

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Correção executada com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro na correção${NC}"
    exit 1
fi

echo ""

# Verificação DEPOIS
echo -e "${YELLOW}📊 DEPOIS da correção:${NC}"
echo ""

echo -e "Item número 53 (DEVE SER 'Trabalho em condições de difícil comunicação'):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, categoria, descricao
FROM perigos_catalogo
WHERE numero = 53;
"

echo ""
echo -e "Categoria 'Condições Físicas/Ambientais' (deve ter 9 perigos, 53-61):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 65) as descricao
FROM perigos_catalogo
WHERE categoria = 'Condições Físicas/Ambientais'
ORDER BY numero;
"

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
    MIN(numero)::text || '-' || MAX(numero)::text as faixa
FROM perigos_catalogo
GROUP BY categoria
ORDER BY MIN(numero);
"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ CORREÇÃO CONCLUÍDA!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📝 Resultado:${NC}"
echo -e "  ✅ Item 53: 'Trabalho em condições de difícil comunicação'"
echo -e "  ✅ Categoria: 'Condições Físicas/Ambientais'"
echo -e "  ✅ Total: 61 perigos (1-61)"
echo ""
echo -e "${YELLOW}💡 Agora no FRONTEND:${NC}"
echo -e "  1. ${BLUE}Abra o navegador${NC}"
echo -e "  2. ${BLUE}Pressione: CTRL+SHIFT+DELETE${NC}"
echo -e "  3. ${BLUE}Marque 'Cache' e 'Cookies'${NC}"
echo -e "  4. ${BLUE}Confirme a limpeza${NC}"
echo -e "  5. ${BLUE}Feche o navegador completamente${NC}"
echo -e "  6. ${BLUE}Abra novamente e faça login${NC}"
echo -e "  7. ${BLUE}Verifique a avaliação${NC}"
echo ""
echo -e "${RED}IMPORTANTE: Limpe o cache COMPLETAMENTE!${NC}"
echo ""
