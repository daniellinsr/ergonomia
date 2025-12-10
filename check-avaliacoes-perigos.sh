#!/bin/bash

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Verificando Perigos por Avaliação${NC}"
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

# Encontrar container (excluir container de backup)
POSTGRES_CONTAINER=$(docker ps --filter "name=ergonomia_postgres" --format "{{.Names}}" | grep -v backup | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo -e "${RED}❌ Erro: Container PostgreSQL não encontrado!${NC}"
    exit 1
fi

echo -e "${YELLOW}📊 Total de perigos no catálogo:${NC}"
docker exec -i -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) as total FROM perigos_catalogo;"
echo ""

echo -e "${YELLOW}📊 Perigos por avaliação:${NC}"
docker exec -i -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
  a.id,
  a.titulo,
  a.status,
  a.created_at::date as criada_em,
  COUNT(pi.id) as total_perigos_registrados,
  COUNT(CASE WHEN pi.identificado = true THEN 1 END) as identificados,
  COUNT(CASE WHEN pi.identificado = false THEN 1 END) as nao_identificados,
  COUNT(CASE WHEN pi.identificado IS NULL THEN 1 END) as sem_resposta
FROM avaliacoes_ergonomicas a
LEFT JOIN perigos_identificados pi ON a.id = pi.avaliacao_id
GROUP BY a.id, a.titulo, a.status, a.created_at
ORDER BY a.id;
"
echo ""

echo -e "${YELLOW}📊 Verificando se alguma avaliação tem menos de 61 perigos:${NC}"
docker exec -i -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
  a.id,
  a.titulo,
  COUNT(pi.id) as total_perigos
FROM avaliacoes_ergonomicas a
LEFT JOIN perigos_identificados pi ON a.id = pi.avaliacao_id
GROUP BY a.id, a.titulo
HAVING COUNT(pi.id) < 61
ORDER BY a.id;
"
echo ""
