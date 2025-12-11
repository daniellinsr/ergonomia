#!/bin/bash

# Script para FORÇAR reindexação por categoria

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  FORÇAR REINDEXAÇÃO POR CATEGORIA${NC}"
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

read -p "Confirma FORÇAR reindexação por categoria? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⚠️  Operação cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Forçando reindexação...${NC}"
echo ""

# Executar reindexação FORÇADA
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" << 'EOSQL'

DO $$
DECLARE
    r RECORD;
    contador INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '  REINDEXAÇÃO FORÇADA POR CATEGORIA';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '';

    -- Remover constraints
    ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_numero_key;
    ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_categoria_numero_key;

    RAISE NOTICE 'Constraints removidas';

    -- 1. BIOMECÂNICOS (1-16)
    contador := 1;
    FOR r IN
        SELECT id FROM perigos_catalogo
        WHERE categoria = 'Biomecânicos'
        ORDER BY numero
    LOOP
        UPDATE perigos_catalogo SET numero = contador WHERE id = r.id;
        contador := contador + 1;
    END LOOP;
    RAISE NOTICE 'Biomecânicos: 1-%', contador - 1;

    -- 2. MOBILIÁRIO/EQUIPAMENTOS (1-17)
    contador := 1;
    FOR r IN
        SELECT id FROM perigos_catalogo
        WHERE categoria = 'Mobiliário/Equipamentos'
        ORDER BY numero
    LOOP
        UPDATE perigos_catalogo SET numero = contador WHERE id = r.id;
        contador := contador + 1;
    END LOOP;
    RAISE NOTICE 'Mobiliário/Equipamentos: 1-%', contador - 1;

    -- 3. ORGANIZAÇÃO/COGNITIVO/PSICOSSOCIAL (1-20)
    contador := 1;
    FOR r IN
        SELECT id FROM perigos_catalogo
        WHERE categoria = 'Organização/Cognitivo/Psicossocial'
        ORDER BY numero
    LOOP
        UPDATE perigos_catalogo SET numero = contador WHERE id = r.id;
        contador := contador + 1;
    END LOOP;
    RAISE NOTICE 'Organização/Cognitivo/Psicossocial: 1-%', contador - 1;

    -- 4. CONDIÇÕES FÍSICAS/AMBIENTAIS (1-8)
    -- Primeiro o "Trabalho em condições de difícil comunicação" se existir
    contador := 1;
    FOR r IN
        SELECT id FROM perigos_catalogo
        WHERE categoria = 'Condições Físicas/Ambientais'
        ORDER BY
            CASE WHEN descricao = 'Trabalho em condições de difícil comunicação' THEN 0
            ELSE numero
            END,
            numero
    LOOP
        UPDATE perigos_catalogo SET numero = contador WHERE id = r.id;
        contador := contador + 1;
    END LOOP;
    RAISE NOTICE 'Condições Físicas/Ambientais: 1-%', contador - 1;

    -- Criar constraint composta
    ALTER TABLE perigos_catalogo
        ADD CONSTRAINT perigos_catalogo_categoria_numero_key
        UNIQUE (categoria, numero);

    RAISE NOTICE '';
    RAISE NOTICE 'Constraint criada: (categoria, numero) UNIQUE';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '  ✅ REINDEXAÇÃO CONCLUÍDA!';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '';
END $$;

EOSQL

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Reindexação forçada com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro na reindexação${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📊 VERIFICAÇÃO FINAL:${NC}"
echo ""

echo -e "1. Distribuição:"
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
echo -e "2. Mobiliário/Equipamentos (primeiros 5):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 50) as descricao
FROM perigos_catalogo
WHERE categoria = 'Mobiliário/Equipamentos'
ORDER BY numero
LIMIT 5;
"

echo ""
echo -e "3. Condições Físicas/Ambientais (todos):"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, LEFT(descricao, 50) as descricao
FROM perigos_catalogo
WHERE categoria = 'Condições Físicas/Ambientais'
ORDER BY numero;
"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  SE OS NÚMEROS ESTÃO 1-16, 1-17, etc${NC}"
echo -e "${GREEN}  A REINDEXAÇÃO FUNCIONOU! ✅${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${RED}AGORA: Limpe o cache (CTRL+SHIFT+R)${NC}"
echo ""
