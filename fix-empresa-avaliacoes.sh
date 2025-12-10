#!/bin/bash

# Script para transferir avaliações para a empresa correta

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Transferir Avaliações de Empresa${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Carregar .env
if [ ! -f .env ]; then
    echo -e "${RED}❌ Erro: Arquivo .env não encontrado!${NC}"
    exit 1
fi

set -a
source .env
set +a

# Encontrar container
POSTGRES_CONTAINER=$(docker ps --filter "name=ergonomia_postgres" --format "{{.Names}}" | grep -v backup | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo -e "${RED}❌ Erro: Container PostgreSQL não encontrado!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Container encontrado: $POSTGRES_CONTAINER${NC}"
echo ""

# IDs identificados no diagnóstico
EMPRESA_ORIGEM="fa44072b-6174-4b12-9929-6e2b88b4e838"
EMPRESA_DESTINO="341df671-aaad-445d-805f-af345bf8af41"

echo -e "${YELLOW}📋 Informações:${NC}"
echo -e "  Empresa de origem (com avaliações): $EMPRESA_ORIGEM"
echo -e "  Empresa de destino (do usuário):    $EMPRESA_DESTINO"
echo ""

# Verificar quantas avaliações serão transferidas
echo -e "${YELLOW}🔍 Verificando avaliações a serem transferidas...${NC}"
TOTAL_AVALIACOES=$(docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT COUNT(*) FROM avaliacoes_ergonomicas WHERE empresa_id = '$EMPRESA_ORIGEM'::uuid;
" | xargs)

echo -e "${GREEN}  ✓ Total de avaliações: $TOTAL_AVALIACOES${NC}"
echo ""

# Mostrar detalhes das avaliações
echo -e "${YELLOW}📊 Avaliações que serão transferidas:${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT id, titulo, data_avaliacao, status
FROM avaliacoes_ergonomicas
WHERE empresa_id = '$EMPRESA_ORIGEM'::uuid;
"
echo ""

# Confirmar operação
echo -e "${YELLOW}⚠️  ATENÇÃO: Esta operação irá transferir $TOTAL_AVALIACOES avaliações${NC}"
echo -e "${YELLOW}da empresa $EMPRESA_ORIGEM${NC}"
echo -e "${YELLOW}para a empresa $EMPRESA_DESTINO${NC}"
echo ""
echo -e "${YELLOW}Deseja continuar? (s/n)${NC}"
read CONFIRMAR

if [ "$CONFIRMAR" != "s" ]; then
    echo -e "${RED}❌ Operação cancelada.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Transferindo avaliações...${NC}"

# Executar UPDATE
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
UPDATE avaliacoes_ergonomicas
SET empresa_id = '$EMPRESA_DESTINO'::uuid
WHERE empresa_id = '$EMPRESA_ORIGEM'::uuid;
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Avaliações transferidas com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao transferir avaliações${NC}"
    exit 1
fi

echo ""

# Verificar resultado
echo -e "${YELLOW}🔍 Verificando resultado...${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  empresa_id,
  COUNT(*) as total_avaliacoes
FROM avaliacoes_ergonomicas
GROUP BY empresa_id;
"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Operação Concluída!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}💡 Próximo passo:${NC}"
echo -e "1. Atualize a página de Relatórios no navegador (F5)"
echo -e "2. Os dados devem aparecer agora!"
echo ""
