#!/bin/bash

# Script para verificar a versão do frontend deployado

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Verificar Versão Frontend${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Encontrar container do frontend
FRONTEND_CONTAINER=$(docker ps --filter "name=ergonomia_frontend" --format "{{.Names}}" | head -1)

if [ -z "$FRONTEND_CONTAINER" ]; then
    echo -e "${RED}❌ Erro: Container frontend não encontrado!${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Container encontrado: $FRONTEND_CONTAINER${NC}"
echo ""

echo -e "${YELLOW}🔍 Verificando conteúdo do arquivo classificacaoRisco.js no container:${NC}"
echo ""

# Verificar se o arquivo tem as categorias corretas
docker exec $FRONTEND_CONTAINER grep -A 5 "agruparPerigosPorCategoria" /usr/share/nginx/html/assets/*.js 2>/dev/null | head -20 || echo "Arquivo não encontrado diretamente"

echo ""
echo -e "${YELLOW}🔍 Buscando pela string 'Organização/Cognitivo/Psicossocial' nos assets:${NC}"
docker exec $FRONTEND_CONTAINER grep -r "Organização/Cognitivo/Psicossocial" /usr/share/nginx/html/assets/ 2>/dev/null && echo -e "${GREEN}✅ Encontrado (versão correta)${NC}" || echo -e "${RED}❌ Não encontrado (versão antiga)${NC}"

echo ""
echo -e "${YELLOW}🔍 Buscando pela string antiga 'Organização/Cognitivo/Psicossociais' nos assets:${NC}"
docker exec $FRONTEND_CONTAINER grep -r "Organização/Cognitivo/Psicossociais" /usr/share/nginx/html/assets/ 2>/dev/null && echo -e "${RED}❌ Encontrado (versão ANTIGA!)${NC}" || echo -e "${GREEN}✅ Não encontrado (correto)${NC}"

echo ""
echo -e "${YELLOW}📊 Data de criação dos arquivos assets:${NC}"
docker exec $FRONTEND_CONTAINER ls -lh /usr/share/nginx/html/assets/

echo ""
