#!/bin/bash

# Script de Deploy para Docker Swarm
# Este script carrega as variáveis do .env antes de fazer o deploy

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deploy Docker Swarm - Ergonomia${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo -e "${RED}❌ Erro: Arquivo .env não encontrado!${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Carregando variáveis de ambiente do .env...${NC}"

# Exportar todas as variáveis do .env
set -a
source .env
set +a

echo -e "${GREEN}✅ Variáveis carregadas${NC}"
echo ""

# Verificar variáveis críticas
echo -e "${YELLOW}🔍 Verificando variáveis críticas...${NC}"
required_vars=("DB_NAME" "DB_USER" "DB_PASSWORD" "JWT_SECRET" "JWT_REFRESH_SECRET")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    else
        echo -e "${GREEN}  ✓ $var definido${NC}"
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo -e "${RED}❌ Erro: Variáveis obrigatórias não definidas:${NC}"
    for var in "${missing_vars[@]}"; do
        echo -e "${RED}  - $var${NC}"
    done
    exit 1
fi

echo ""
echo -e "${YELLOW}🚀 Fazendo deploy do stack...${NC}"

# Deploy do stack
docker stack deploy -c docker-compose.swarm.yml ergonomia

echo ""
echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo ""
echo -e "${YELLOW}📊 Status dos serviços:${NC}"
docker stack services ergonomia

echo ""
echo -e "${YELLOW}💡 Dica: Use 'docker service logs ergonomia_backend --follow' para ver os logs${NC}"
echo ""
