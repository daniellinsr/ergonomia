#!/bin/bash

# Script para deploy do destaque vermelho em "Não Avaliado"

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Deploy: Destaque Vermelho${NC}"
echo -e "${BLUE}  'Não Avaliado' em Avaliações${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. Build do Frontend
echo -e "${YELLOW}📦 1. Buildando Frontend...${NC}"
cd frontend
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend buildado com sucesso${NC}"
else
    echo -e "${RED}❌ Erro ao buildar frontend${NC}"
    exit 1
fi
echo ""

# 2. Build da imagem Docker
echo -e "${YELLOW}🐳 2. Buildando imagem Docker do Frontend...${NC}"
cd ..
docker build -t ergonomia-frontend:latest ./frontend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Imagem Docker criada com sucesso${NC}"
else
    echo -e "${RED}❌ Erro ao criar imagem Docker${NC}"
    exit 1
fi
echo ""

# 3. Deploy no Swarm
echo -e "${YELLOW}🚀 3. Fazendo deploy no Docker Swarm...${NC}"
docker stack deploy -c docker-compose.swarm.yml ergonomia

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deploy realizado com sucesso${NC}"
else
    echo -e "${RED}❌ Erro ao fazer deploy${NC}"
    exit 1
fi
echo ""

# 4. Aguardar alguns segundos
echo -e "${YELLOW}⏳ Aguardando atualização dos serviços...${NC}"
sleep 5
echo ""

# 5. Verificar status do serviço
echo -e "${YELLOW}📊 4. Status do serviço Frontend:${NC}"
docker service ps ergonomia_frontend --no-trunc

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Deploy Concluído!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📝 Próximos passos:${NC}"
echo -e "  1. Acesse a aplicação no navegador"
echo -e "  2. Faça login e vá para uma avaliação em andamento"
echo -e "  3. Verifique se os perigos 'Não Avaliado' aparecem em ${RED}VERMELHO${NC}"
echo ""
echo -e "${YELLOW}🔍 Para verificar logs do frontend:${NC}"
echo -e "  docker service logs ergonomia_frontend --tail 50 -f"
echo ""
echo -e "${YELLOW}📋 Detalhes da alteração:${NC}"
echo -e "  - Fundo do card: ${RED}Rosa claro (bg-red-50)${NC}"
echo -e "  - Ícone: ${RED}Vermelho (text-red-500)${NC}"
echo -e "  - Borda esquerda: ${RED}Vermelho claro (border-red-300)${NC}"
echo -e "  - Badge: ${RED}Fundo vermelho claro com texto vermelho escuro${NC}"
echo ""
