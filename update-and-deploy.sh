#!/bin/bash

# Script para atualizar e fazer deploy das correções
# Uso: ./update-and-deploy.sh

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Update & Deploy - Ergonomia${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Git pull
echo -e "${YELLOW}📥 Atualizando código do repositório...${NC}"
git pull
echo -e "${GREEN}✅ Código atualizado${NC}"
echo ""

# Build frontend
echo -e "${YELLOW}🔨 Compilando frontend...${NC}"
cd frontend
npm run build
cd ..
echo -e "${GREEN}✅ Frontend compilado${NC}"
echo ""

# Deploy
echo -e "${YELLOW}🚀 Fazendo deploy do stack...${NC}"
bash deploy-swarm.sh
echo -e "${GREEN}✅ Deploy concluído${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Atualização completa!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo -e "${YELLOW}   1. Aguarde ~30 segundos para os containers reiniciarem${NC}"
echo -e "${YELLOW}   2. Acesse a aplicação e verifique se os 61 perigos aparecem${NC}"
echo ""
