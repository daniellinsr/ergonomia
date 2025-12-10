#!/bin/bash

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Testando Conexão PostgreSQL${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Carregar .env
if [ ! -f .env ]; then
    echo -e "${RED}❌ Erro: Arquivo .env não encontrado!${NC}"
    exit 1
fi

set -a
source .env
set +a

# Encontrar container (excluir container de backup)
POSTGRES_CONTAINER=$(docker ps --filter "name=ergonomia_postgres" --format "{{.Names}}" | grep -v backup | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo -e "${RED}❌ Erro: Container PostgreSQL não encontrado!${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Container: $POSTGRES_CONTAINER${NC}"
echo ""

echo -e "${YELLOW}🔍 Verificando processos no container...${NC}"
docker exec $POSTGRES_CONTAINER ps aux
echo ""

echo -e "${YELLOW}🔍 Verificando se PostgreSQL está escutando...${NC}"
docker exec $POSTGRES_CONTAINER netstat -tuln 2>/dev/null || docker exec $POSTGRES_CONTAINER ss -tuln || echo "netstat/ss não disponível"
echo ""

echo -e "${YELLOW}🔍 Verificando socket Unix...${NC}"
docker exec $POSTGRES_CONTAINER ls -la /var/run/postgresql/ || echo "Diretório não existe"
echo ""

echo -e "${YELLOW}🔍 Testando pg_isready...${NC}"
docker exec $POSTGRES_CONTAINER pg_isready -U "$DB_USER" -d "$DB_NAME"
echo ""

echo -e "${YELLOW}🔍 Testando conexão psql simples...${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();"
echo ""

echo -e "${YELLOW}🔍 Variáveis de ambiente no container...${NC}"
docker exec $POSTGRES_CONTAINER env | grep POSTGRES
echo ""
