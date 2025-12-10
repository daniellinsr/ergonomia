#!/bin/bash

# Script para remover duplicação do perigo 61

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Correção: Remover Duplicação${NC}"
echo -e "${BLUE}  Perigo 61 (Duplicado)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Carregar variáveis do .env
if [ ! -f .env ]; then
    echo -e "${RED}❌ Erro: Arquivo .env não encontrado!${NC}"
    exit 1
fi

set -a
source .env
set +a

# Verificar se o PostgreSQL está rodando
echo -e "${YELLOW}🔍 Verificando PostgreSQL...${NC}"
POSTGRES_CONTAINER=$(docker ps --filter "name=ergonomia_postgres" --format "{{.Names}}" | grep -v backup | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo -e "${RED}❌ Erro: Container PostgreSQL não encontrado!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL encontrado: $POSTGRES_CONTAINER${NC}"
echo ""

# Verificar total de perigos
echo -e "${YELLOW}📊 Estado atual do catálogo:${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT COUNT(*) as total_perigos FROM perigos_catalogo;
"
echo ""

# Verificar duplicação
echo -e "${YELLOW}🔍 Verificando duplicação do perigo:${NC}"
echo -e "${BLUE}'Trabalho em condições de difícil comunicação'${NC}"
echo ""
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, categoria, descricao
FROM perigos_catalogo
WHERE descricao = 'Trabalho em condições de difícil comunicação'
ORDER BY numero;
"
echo ""

# Confirmar correção
echo -e "${YELLOW}🔧 Correção a ser aplicada:${NC}"
echo -e "  ${GREEN}✅ Manter: Item #37${NC} em 'Organização/Cognitivo/Psicossocial'"
echo -e "  ${RED}❌ Remover: Item #61${NC} (duplicado em 'Condições Físicas/Ambientais')"
echo -e ""
echo -e "  ${BLUE}Resultado: Catálogo terá 60 perigos (1-60, sem duplicação)${NC}"
echo ""

read -p "Deseja aplicar a correção? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⚠️  Operação cancelada pelo usuário${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🗑️  Removendo perigo 61 duplicado...${NC}"

# Remover perigo 61 (duplicado)
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
DELETE FROM perigos_catalogo
WHERE numero = 61
  AND descricao = 'Trabalho em condições de difícil comunicação'
  AND categoria = 'Condições Físicas/Ambientais';
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Perigo 61 duplicado removido com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao remover perigo duplicado${NC}"
    exit 1
fi

echo ""

# Verificar resultado
echo -e "${YELLOW}📊 Estado após correção:${NC}"
echo ""
echo -e "${YELLOW}Total de perigos:${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT COUNT(*) as total_perigos FROM perigos_catalogo;
"
echo ""

echo -e "${YELLOW}Perigos com 'difícil comunicação':${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, categoria, descricao
FROM perigos_catalogo
WHERE descricao LIKE '%difícil comunicação%'
ORDER BY numero;
"
echo ""

echo -e "${YELLOW}Últimos perigos (55-60):${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, categoria, LEFT(descricao, 50) as descricao
FROM perigos_catalogo
WHERE numero >= 55
ORDER BY numero;
"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Correção Concluída!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📝 Resumo:${NC}"
echo -e "  - Perigo #61 (duplicado) foi removido"
echo -e "  - Perigo #37 mantido na categoria correta"
echo -e "  - Catálogo agora tem ${GREEN}60 perigos${NC} (1-60)"
echo -e "  - Numeração sequencial sem duplicações"
echo ""
echo -e "${YELLOW}💡 Nota:${NC}"
echo -e "  - Perigos vão de 1 a 60"
echo -e "  - Item 37: 'Trabalho em condições de difícil comunicação'"
echo -e "  - Categoria: Organização/Cognitivo/Psicossocial"
echo ""
