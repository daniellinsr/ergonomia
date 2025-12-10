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

# Deploy (o build do frontend acontece dentro do Dockerfile)
echo -e "${YELLOW}🚀 Fazendo deploy do stack...${NC}"
echo -e "${YELLOW}   O Docker vai rebuildar as imagens com o código atualizado${NC}"
bash deploy-swarm.sh
echo -e "${GREEN}✅ Deploy concluído${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Atualização completa!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo -e "${YELLOW}   1. Aguarde ~1 minuto para os containers reiniciarem e buildarem${NC}"
echo -e "${YELLOW}   2. Acesse a aplicação e verifique se os 61 perigos aparecem${NC}"
echo -e "${YELLOW}   3. As categorias devem mostrar:${NC}"
echo -e "${YELLOW}      - Biomecânicos: 16 perigos${NC}"
echo -e "${YELLOW}      - Mobiliário/Equipamentos: 17 perigos${NC}"
echo -e "${YELLOW}      - Organização/Cognitivo/Psicossocial: 19 perigos${NC}"
echo -e "${YELLOW}      - Condições Físicas/Ambientais: 9 perigos${NC}"
echo ""
