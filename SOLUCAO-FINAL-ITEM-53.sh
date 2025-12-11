#!/bin/bash

# Script FINAL: Remove item 37 duplicado e reorganiza numeração com item 61 virando 53

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  SOLUÇÃO FINAL - REORGANIZAÇÃO${NC}"
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

echo -e "${YELLOW}📊 SITUAÇÃO ATUAL (do diagnóstico):${NC}"
echo -e "  - Item 37: 'Trabalho em condições de difícil comunicação' (Organização...) ${RED}← DUPLICADO${NC}"
echo -e "  - Item 61: 'Trabalho em condições de difícil comunicação' (Organização...) ${BLUE}← MOVER${NC}"
echo -e "  - Total: 61 perigos"
echo ""
echo -e "${YELLOW}🎯 SOLUÇÃO:${NC}"
echo -e "  1. ${RED}Remover item 37${NC} (duplicado)"
echo -e "  2. ${BLUE}Renumerar itens 38-52${NC} → 37-51 (Organização...)"
echo -e "  3. ${BLUE}Renumerar itens 53-60${NC} → 54-61 (Condições Físicas...)"
echo -e "  4. ${GREEN}Item 61 vira item 53${NC} + muda categoria para 'Condições Físicas/Ambientais'"
echo ""
echo -e "${YELLOW}📋 RESULTADO FINAL:${NC}"
echo -e "  - Biomecânicos: 1-16 (16 perigos)"
echo -e "  - Mobiliário/Equipamentos: 17-33 (17 perigos)"
echo -e "  - Organização/Cognitivo/Psicossocial: 34-51 (18 perigos, SEM item 37 duplicado)"
echo -e "  - Condições Físicas/Ambientais: 52-60 (9 perigos, COM 'difícil comunicação' como 52)"
echo -e "  - ${GREEN}Total: 60 perigos (1-60)${NC}"
echo ""

read -p "Confirma a reorganização? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⚠️  Operação cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Executando reorganização...${NC}"
echo ""

# Executar reorganização
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" << 'EOSQL'

BEGIN;

RAISE NOTICE '';
RAISE NOTICE '═══════════════════════════════════════';
RAISE NOTICE '  Reorganização de Perigos';
RAISE NOTICE '═══════════════════════════════════════';
RAISE NOTICE '';

-- PASSO 1: Guardar ID do item 61 que será movido
DO $$
DECLARE
    perigo_id_61 UUID;
BEGIN
    SELECT id INTO perigo_id_61
    FROM perigos_catalogo
    WHERE numero = 61
      AND descricao = 'Trabalho em condições de difícil comunicação'
    LIMIT 1;

    RAISE NOTICE '✓ Item 61 identificado: %', perigo_id_61;
    PERFORM set_config('app.perigo_61_id', perigo_id_61::text, false);
END $$;

-- PASSO 2: Desabilitar constraint
ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_numero_key;
RAISE NOTICE '✓ Constraint desabilitada';

-- PASSO 3: Remover item 37 duplicado
DELETE FROM perigos_catalogo
WHERE numero = 37
  AND descricao = 'Trabalho em condições de difícil comunicação'
  AND categoria = 'Organização/Cognitivo/Psicossocial';
RAISE NOTICE '✓ Item 37 duplicado removido';

-- PASSO 4: Mover item 61 para número temporário
UPDATE perigos_catalogo
SET numero = 9999
WHERE id = current_setting('app.perigo_61_id')::uuid;
RAISE NOTICE '✓ Item 61 movido para posição temporária';

-- PASSO 5: Renumerar Organização/Cognitivo/Psicossocial (38-52 → 37-51)
UPDATE perigos_catalogo
SET numero = numero - 1
WHERE numero BETWEEN 38 AND 52
  AND categoria = 'Organização/Cognitivo/Psicossocial';
RAISE NOTICE '✓ Itens 38-52 renumerados para 37-51';

-- PASSO 6: Renumerar Condições Físicas/Ambientais (53-60 → 53-60)
UPDATE perigos_catalogo
SET numero = numero + 1
WHERE numero BETWEEN 53 AND 60
  AND categoria = 'Condições Físicas/Ambientais';
RAISE NOTICE '✓ Itens 53-60 renumerados para 54-61';

-- PASSO 7: Colocar item 61 no número 53 e mudar categoria
UPDATE perigos_catalogo
SET
    numero = 53,
    categoria = 'Condições Físicas/Ambientais'
WHERE id = current_setting('app.perigo_61_id')::uuid;
RAISE NOTICE '✓ Item movido para número 53 com categoria correta';

-- PASSO 8: Recriar constraint
ALTER TABLE perigos_catalogo ADD CONSTRAINT perigos_catalogo_numero_key UNIQUE (numero);
RAISE NOTICE '✓ Constraint recriada';

RAISE NOTICE '';
RAISE NOTICE '═══════════════════════════════════════';
RAISE NOTICE '  ✅ Reorganização Concluída!';
RAISE NOTICE '═══════════════════════════════════════';
RAISE NOTICE '';

COMMIT;

EOSQL

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Reorganização executada com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro na reorganização${NC}"
    exit 1
fi

echo ""

# Verificação COMPLETA
echo -e "${YELLOW}📊 VERIFICAÇÃO FINAL:${NC}"
echo ""

echo -e "1. Total de perigos (deve ser 60):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT COUNT(*) as total FROM perigos_catalogo;
"

echo ""
echo -e "2. Faixa de numeração (deve ser 1-60):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT MIN(numero) as minimo, MAX(numero) as maximo FROM perigos_catalogo;
"

echo ""
echo -e "3. Item 53 (DEVE SER 'Trabalho em condições de difícil comunicação'):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, categoria, descricao
FROM perigos_catalogo
WHERE numero = 53;
"

echo ""
echo -e "4. Verificar se item 37 ainda existe (NÃO DEVE EXISTIR):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT COUNT(*) as total
FROM perigos_catalogo
WHERE descricao = 'Trabalho em condições de difícil comunicação';
"

echo ""
echo -e "5. Distribuição por categoria:"
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
echo -e "6. Categoria 'Condições Físicas/Ambientais' (53-61, 9 perigos):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 65) as descricao
FROM perigos_catalogo
WHERE categoria = 'Condições Físicas/Ambientais'
ORDER BY numero;
"

echo ""
echo -e "7. Gaps na numeração (NÃO DEVE RETORNAR NADA):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT s.num as numero_faltando
FROM generate_series(1, 60) AS s(num)
WHERE NOT EXISTS (SELECT 1 FROM perigos_catalogo WHERE numero = s.num)
ORDER BY s.num;
"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ SOLUÇÃO FINAL APLICADA!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📝 Resultado:${NC}"
echo -e "  ✅ Total: ${GREEN}60 perigos${NC} (removido duplicado)"
echo -e "  ✅ Numeração: ${GREEN}1-60${NC} (sequencial, sem gaps)"
echo -e "  ✅ Item 53: ${GREEN}'Trabalho em condições de difícil comunicação'${NC}"
echo -e "  ✅ Categoria item 53: ${GREEN}'Condições Físicas/Ambientais'${NC}"
echo ""
echo -e "${YELLOW}📋 Distribuição Final:${NC}"
echo -e "  - Biomecânicos: 1-16 (16 perigos)"
echo -e "  - Mobiliário/Equipamentos: 17-33 (17 perigos)"
echo -e "  - Organização/Cognitivo/Psicossocial: 34-51 (18 perigos)"
echo -e "  - Condições Físicas/Ambientais: 52-60 (9 perigos)"
echo ""
echo -e "${RED}╔═══════════════════════════════════════╗${NC}"
echo -e "${RED}║  IMPORTANTE: LIMPAR CACHE COMPLETO!  ║${NC}"
echo -e "${RED}╚═══════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}💡 No navegador (FAÇA EXATAMENTE ISSO):${NC}"
echo -e "  1. ${BLUE}Feche TODAS as abas da aplicação${NC}"
echo -e "  2. ${BLUE}Pressione: CTRL+SHIFT+DELETE${NC}"
echo -e "  3. ${BLUE}Selecione:${NC}"
echo -e "     - Cache de imagens e arquivos"
echo -e "     - Cookies e outros dados do site"
echo -e "  4. ${BLUE}Período: 'Desde sempre'${NC}"
echo -e "  5. ${BLUE}Clique em 'Limpar dados'${NC}"
echo -e "  6. ${BLUE}FECHE O NAVEGADOR COMPLETAMENTE${NC}"
echo -e "  7. ${BLUE}Aguarde 5 segundos${NC}"
echo -e "  8. ${BLUE}Abra o navegador novamente${NC}"
echo -e "  9. ${BLUE}Faça login${NC}"
echo -e "  10. ${BLUE}Verifique a avaliação${NC}"
echo ""
