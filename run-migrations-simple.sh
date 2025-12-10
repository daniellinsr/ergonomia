#!/bin/bash

# Script simplificado para executar migrations copiando para dentro do container

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
POSTGRES_CONTAINER=$(docker ps --filter "name=ergonomia_postgres" --format "{{.Names}}" | grep -v backup | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo -e "${RED}❌ Erro: Container PostgreSQL não encontrado!${NC}"
    echo -e "${YELLOW}Dica: Execute './deploy-swarm.sh' primeiro${NC}"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL encontrado: $POSTGRES_CONTAINER${NC}"
echo ""

# Copiar pasta de migrations para dentro do container
echo -e "${YELLOW}📦 Copiando migrations para o container...${NC}"
docker cp backend/migrations/ $POSTGRES_CONTAINER:/tmp/

echo -e "${GREEN}✅ Migrations copiadas${NC}"
echo ""

# Executar migrations
echo -e "${YELLOW}📋 Executando migrations...${NC}"
echo ""

# Array com os arquivos de migration na ordem
migrations=(
    "001_initial_schema.sql"
    "002_planos_acao.sql"
    "003_remover_trabalhadores.sql"
    "004_sessoes.sql"
    "005_rename_columns_to_english.sql"
    "006_add_user_fields.sql"
    "007_fix_tipo_avaliacao_constraint.sql"
    "008_seed_perigos_catalogo.sql"
    "009_add_peso_columns_classificacao_risco.sql"
    "010_fix_update_trigger.sql"
    "011_fix_perigos_inicial_null.sql"
    "012_create_auditoria_log.sql"
    "013_fix_perigo_61_categoria.sql"
    "014_renumerar_perigos_sequencial.sql"
)

# Executar cada migration
for i in "${!migrations[@]}"; do
    migration_num=$((i + 1))
    migration_file="${migrations[$i]}"

    echo -e "${YELLOW}➜ Migration $(printf "%03d" $migration_num): ${migration_file%.sql}${NC}"

    docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -f "/tmp/migrations/$migration_file"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Migration $(printf "%03d" $migration_num) concluída${NC}"
    else
        echo -e "${RED}❌ Erro na migration $(printf "%03d" $migration_num)${NC}"
        exit 1
    fi
    echo ""
done

# Limpar arquivos temporários
echo -e "${YELLOW}🧹 Limpando arquivos temporários...${NC}"
docker exec $POSTGRES_CONTAINER rm -rf /tmp/migrations/

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Todas as migrations concluídas!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Verificar tabelas criadas
echo -e "${YELLOW}📊 Tabelas criadas:${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "\dt"
echo ""

echo -e "${YELLOW}💡 Próximo passo: Verificar se tudo está funcionando${NC}"
echo -e "${YELLOW}   Use: bash check-categories.sh${NC}"
echo ""
