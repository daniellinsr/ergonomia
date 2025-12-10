#!/bin/bash

# Script para corrigir categoria do perigo 61

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Correção: Categoria do Perigo 61${NC}"
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

# Verificar estado atual do perigo 61
echo -e "${YELLOW}📊 Estado atual do perigo 61:${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, categoria, descricao
FROM perigos_catalogo
WHERE numero = 61;
"
echo ""

# Confirmar correção
echo -e "${YELLOW}🔧 Correção a ser aplicada:${NC}"
echo -e "  Perigo: ${BLUE}#61 - Trabalho em condições de difícil comunicação${NC}"
echo -e "  De: ${RED}Condições Físicas/Ambientais${NC}"
echo -e "  Para: ${GREEN}Organização/Cognitivo/Psicossocial${NC}"
echo ""

read -p "Deseja aplicar a correção? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⚠️  Operação cancelada pelo usuário${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Atualizando categoria...${NC}"

# Atualizar categoria do perigo 61
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
UPDATE perigos_catalogo
SET categoria = 'Organização/Cognitivo/Psicossocial'
WHERE numero = 61;
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Categoria atualizada com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao atualizar categoria${NC}"
    exit 1
fi

echo ""

# Verificar resultado
echo -e "${YELLOW}📊 Estado após correção:${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT numero, categoria, descricao
FROM perigos_catalogo
WHERE numero = 61;
"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Correção Concluída!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📝 Resumo:${NC}"
echo -e "  - Perigo #61 agora está na categoria correta"
echo -e "  - Categoria: ${GREEN}Organização/Cognitivo/Psicossocial${NC}"
echo -e "  - Descrição: Trabalho em condições de difícil comunicação"
echo ""
echo -e "${YELLOW}💡 Nota:${NC}"
echo -e "  - Esta correção afeta apenas o catálogo de perigos"
echo -e "  - Avaliações já criadas manterão a categoria antiga"
echo -e "  - Novas avaliações usarão a categoria correta"
echo ""
