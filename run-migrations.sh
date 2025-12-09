#!/bin/bash

# Script para executar migrations no PostgreSQL via Docker Swarm
# Uso: ./run-migrations.sh

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Executando Migrations - Ergonomia${NC}"
echo -e "${GREEN}========================================${NC}"
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
echo -e "${YELLOW}🔍 Verificando se o PostgreSQL está rodando...${NC}"
POSTGRES_CONTAINER=$(docker ps --filter "name=ergonomia_postgres" --format "{{.Names}}" | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo -e "${RED}❌ Erro: Container PostgreSQL não encontrado!${NC}"
    echo -e "${YELLOW}Dica: Execute './deploy-swarm.sh' primeiro${NC}"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL encontrado: $POSTGRES_CONTAINER${NC}"
echo ""

# Executar migrations
echo -e "${YELLOW}📋 Executando migrations...${NC}"
echo ""

# Migration 1: Initial Schema
echo -e "${YELLOW}➜ Migration 001: Initial Schema${NC}"
docker exec -i $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" < backend/migrations/001_initial_schema.sql
echo -e "${GREEN}✅ Migration 001 concluída${NC}"
echo ""

# Migration 2: Planos de Ação
echo -e "${YELLOW}➜ Migration 002: Planos de Ação${NC}"
docker exec -i $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" < backend/migrations/002_planos_acao.sql
echo -e "${GREEN}✅ Migration 002 concluída${NC}"
echo ""

# Migration 3: Remover Trabalhadores
echo -e "${YELLOW}➜ Migration 003: Remover Trabalhadores${NC}"
docker exec -i $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" < backend/migrations/003_remover_trabalhadores.sql
echo -e "${GREEN}✅ Migration 003 concluída${NC}"
echo ""

# Migration 4: Sessões
echo -e "${YELLOW}➜ Migration 004: Tabela de Sessões${NC}"
docker exec -i $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" < backend/migrations/004_sessoes.sql
echo -e "${GREEN}✅ Migration 004 concluída${NC}"
echo ""

# Migration 5: Renomear colunas para inglês
echo -e "${YELLOW}➜ Migration 005: Padronizar nomes de colunas${NC}"
docker exec -i $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" < backend/migrations/005_rename_columns_to_english.sql
echo -e "${GREEN}✅ Migration 005 concluída${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Todas as migrations concluídas!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Verificar tabelas criadas
echo -e "${YELLOW}📊 Tabelas criadas:${NC}"
docker exec -i $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "\dt"
echo ""

echo -e "${YELLOW}💡 Próximo passo: Criar usuário admin inicial${NC}"
echo -e "${YELLOW}   Use: ./create-admin.sh${NC}"
echo ""
