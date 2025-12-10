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

# Migration 6: Adicionar campos de usuário
echo -e "${YELLOW}➜ Migration 006: Adicionar CPF e tipo_profissional${NC}"
docker exec -i $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" < backend/migrations/006_add_user_fields.sql
echo -e "${GREEN}✅ Migration 006 concluída${NC}"
echo ""

# Migration 7: Corrigir constraint tipo_avaliacao
echo -e "${YELLOW}➜ Migration 007: Corrigir constraint tipo_avaliacao${NC}"
docker exec -i $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" < backend/migrations/007_fix_tipo_avaliacao_constraint.sql
echo -e "${GREEN}✅ Migration 007 concluída${NC}"
echo ""

# Migration 8: Popular catálogo de perigos
echo -e "${YELLOW}➜ Migration 008: Popular catálogo de perigos${NC}"
docker exec -i $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" < backend/migrations/008_seed_perigos_catalogo.sql
echo -e "${GREEN}✅ Migration 008 concluída - 61 perigos cadastrados${NC}"
echo ""

# Migration 9: Adicionar colunas de peso
echo -e "${YELLOW}➜ Migration 009: Adicionar peso_severidade e peso_probabilidade${NC}"
docker exec -i $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" < backend/migrations/009_add_peso_columns_classificacao_risco.sql
echo -e "${GREEN}✅ Migration 009 concluída${NC}"
echo ""

# Migration 10: Corrigir trigger de updated_at
echo -e "${YELLOW}➜ Migration 010: Corrigir trigger de updated_at${NC}"
docker exec -i $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" < backend/migrations/010_fix_update_trigger.sql
echo -e "${GREEN}✅ Migration 010 concluída${NC}"
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
