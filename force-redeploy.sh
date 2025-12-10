#!/bin/bash

# Script para forçar redeploy completo - remove serviços e rebuilda tudo

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Force Redeploy - Ergonomia${NC}"
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

echo -e "${YELLOW}⚠️  Este script vai:${NC}"
echo -e "${YELLOW}   1. Remover o stack atual${NC}"
echo -e "${YELLOW}   2. Remover imagens antigas${NC}"
echo -e "${YELLOW}   3. Rebuildar todas as imagens${NC}"
echo -e "${YELLOW}   4. Fazer deploy novamente${NC}"
echo ""
read -p "Continuar? (s/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Cancelado."
    exit 0
fi

echo ""
echo -e "${YELLOW}🗑️  Removendo stack atual...${NC}"
docker stack rm ergonomia || true

echo -e "${YELLOW}⏳ Aguardando remoção completa dos containers (30s)...${NC}"
sleep 30

echo ""
echo -e "${YELLOW}🗑️  Removendo imagens antigas...${NC}"
docker rmi ergonomia-frontend:latest 2>/dev/null || echo "Imagem frontend não encontrada"
docker rmi ergonomia-backend:latest 2>/dev/null || echo "Imagem backend não encontrada"

echo ""
echo -e "${YELLOW}🔨 Buildando imagens do zero (sem cache)...${NC}"
echo ""

echo -e "${YELLOW}🔨 Frontend...${NC}"
docker build --no-cache --progress=plain -t ergonomia-frontend:latest ./frontend

echo ""
echo -e "${YELLOW}🔨 Backend...${NC}"
docker build --no-cache --progress=plain -t ergonomia-backend:latest ./backend

echo ""
echo -e "${GREEN}✅ Imagens buildadas${NC}"
echo ""

echo -e "${YELLOW}🚀 Fazendo deploy do stack...${NC}"
docker stack deploy -c docker-compose.swarm.yml ergonomia

echo ""
echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo ""

echo -e "${YELLOW}⏳ Aguardando serviços ficarem prontos (30s)...${NC}"
sleep 30

echo ""
echo -e "${YELLOW}📊 Status dos serviços:${NC}"
docker stack services ergonomia

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Redeploy completo finalizado!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo -e "${YELLOW}   1. Execute: bash check-frontend-version.sh${NC}"
echo -e "${YELLOW}   2. Verifique se a versão correta foi deployada${NC}"
echo -e "${YELLOW}   3. Acesse a aplicação e teste${NC}"
echo ""
