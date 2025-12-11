#!/bin/bash

# Script para deploy da alteração do label "Observações Gerais"

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  Deploy: Label Observações${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}📝 Alteração:${NC}"
echo -e "  ANTES: 'Observações Gerais (opcional)'"
echo -e "  DEPOIS: 'Observações sobre o risco/ferramenta utilizada/resultados (opcional)'"
echo ""

# 1. Build do Frontend (já foi feito localmente)
echo -e "${YELLOW}📦 1. Build do Frontend...${NC}"
cd frontend
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend buildado${NC}"
else
    echo -e "${RED}❌ Erro ao buildar frontend${NC}"
    exit 1
fi
echo ""

# 2. Build da imagem Docker
echo -e "${YELLOW}🐳 2. Buildando imagem Docker...${NC}"
cd ..
docker build -t ergonomia-frontend:latest ./frontend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Imagem Docker criada${NC}"
else
    echo -e "${RED}❌ Erro ao criar imagem${NC}"
    exit 1
fi
echo ""

# 3. Deploy no Swarm
echo -e "${YELLOW}🚀 3. Deploy no Swarm...${NC}"
docker stack deploy -c docker-compose.swarm.yml ergonomia

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deploy realizado${NC}"
else
    echo -e "${RED}❌ Erro no deploy${NC}"
    exit 1
fi
echo ""

# 4. Aguardar
echo -e "${YELLOW}⏳ Aguardando atualização...${NC}"
sleep 5
echo ""

# 5. Status
echo -e "${YELLOW}📊 Status do serviço:${NC}"
docker service ps ergonomia_frontend --no-trunc | head -5

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Deploy Concluído!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo -e "  1. ${BLUE}Limpar cache do navegador: CTRL+SHIFT+R${NC}"
echo -e "  2. ${BLUE}Acessar 'Nova Avaliação'${NC}"
echo -e "  3. ${BLUE}Verificar novo label${NC}"
echo ""
