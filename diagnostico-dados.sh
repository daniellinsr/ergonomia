#!/bin/bash

# Script para diagnosticar por que os relatórios estão vazios

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Diagnóstico - Dados Vazios${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Carregar .env
if [ ! -f .env ]; then
    echo -e "${RED}❌ Erro: Arquivo .env não encontrado!${NC}"
    exit 1
fi

set -a
source .env
set +a

# Encontrar container
POSTGRES_CONTAINER=$(docker ps --filter "name=ergonomia_postgres" --format "{{.Names}}" | grep -v backup | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo -e "${RED}❌ Erro: Container PostgreSQL não encontrado!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Container encontrado: $POSTGRES_CONTAINER${NC}"
echo ""

# 1. Verificar total de avaliações
echo -e "${YELLOW}📋 1. Verificando total de avaliações...${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  COUNT(*) as total_avaliacoes,
  COUNT(*) FILTER (WHERE status = 'em_andamento') as em_andamento,
  COUNT(*) FILTER (WHERE status = 'finalizada') as finalizadas
FROM avaliacoes_ergonomicas;
"
echo ""

# 2. Verificar avaliações por empresa
echo -e "${YELLOW}👥 2. Verificando avaliações por empresa...${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  empresa_id,
  COUNT(*) as total_avaliacoes
FROM avaliacoes_ergonomicas
GROUP BY empresa_id
ORDER BY empresa_id;
"
echo ""

# 3. Verificar estrutura de uma avaliação
echo -e "${YELLOW}🔍 3. Detalhes de avaliações existentes...${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  a.id,
  a.titulo,
  a.empresa_id,
  a.setor_id,
  a.status,
  a.data_avaliacao,
  s.nome as setor_nome
FROM avaliacoes_ergonomicas a
LEFT JOIN setores s ON a.setor_id = s.id
LIMIT 5;
"
echo ""

# 4. Verificar perigos identificados
echo -e "${YELLOW}⚠️  4. Verificando perigos identificados...${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  COUNT(*) as total_perigos,
  COUNT(*) FILTER (WHERE identificado = true) as identificados_true,
  COUNT(*) FILTER (WHERE identificado = false) as identificados_false,
  COUNT(*) FILTER (WHERE identificado IS NULL) as identificados_null
FROM perigos_identificados;
"
echo ""

# 5. Verificar classificações de risco
echo -e "${YELLOW}📊 5. Verificando classificações de risco...${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  cr.classificacao_final,
  COUNT(*) as total
FROM classificacao_risco cr
GROUP BY cr.classificacao_final
ORDER BY
  CASE cr.classificacao_final
    WHEN 'Intolerável' THEN 1
    WHEN 'Substancial' THEN 2
    WHEN 'Moderado' THEN 3
    WHEN 'Tolerável' THEN 4
    WHEN 'Trivial' THEN 5
  END;
"
echo ""

# 6. Verificar relação completa
echo -e "${YELLOW}🔗 6. Verificando relação completa (avaliações com classificações)...${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  a.id as avaliacao_id,
  a.titulo,
  a.empresa_id,
  COUNT(pi.id) as total_perigos,
  COUNT(pi.id) FILTER (WHERE pi.identificado = true) as perigos_identificados,
  COUNT(cr.id) as total_classificacoes,
  MAX(cr.classificacao_final) as maior_risco
FROM avaliacoes_ergonomicas a
LEFT JOIN perigos_identificados pi ON a.id = pi.avaliacao_id
LEFT JOIN classificacao_risco cr ON pi.id = cr.perigo_identificado_id
GROUP BY a.id, a.titulo, a.empresa_id
LIMIT 10;
"
echo ""

# 7. Obter primeiro empresa_id para teste
echo -e "${YELLOW}🧪 7. Obtendo empresa_id para teste...${NC}"
PRIMEIRA_EMPRESA=$(docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT id FROM empresas LIMIT 1;" | xargs)

if [ -z "$PRIMEIRA_EMPRESA" ]; then
    echo -e "${RED}❌ Nenhuma empresa encontrada!${NC}"
else
    echo -e "${GREEN}✅ Testando com empresa_id: $PRIMEIRA_EMPRESA${NC}"
    echo ""

    echo -e "${YELLOW}🧪 Testando query do inventário...${NC}"
    docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT
      a.id,
      a.data_avaliacao,
      a.tipo_avaliacao,
      a.titulo,
      s.nome as setor_nome,
      u.nome as unidade_nome,
      COUNT(DISTINCT pi.id) FILTER (WHERE pi.identificado = true) as total_perigos,
      (
        SELECT cr2.classificacao_final
        FROM perigos_identificados pi2
        JOIN classificacao_risco cr2 ON pi2.id = cr2.perigo_identificado_id
        WHERE pi2.avaliacao_id = a.id
        ORDER BY cr2.nivel_risco DESC NULLS LAST
        LIMIT 1
      ) as classificacao_risco
    FROM avaliacoes_ergonomicas a
    JOIN setores s ON a.setor_id = s.id
    JOIN unidades u ON s.unidade_id = u.id
    LEFT JOIN perigos_identificados pi ON a.id = pi.avaliacao_id
    LEFT JOIN classificacao_risco cr ON pi.id = cr.perigo_identificado_id
    WHERE a.empresa_id = '$PRIMEIRA_EMPRESA'::uuid
    GROUP BY a.id, a.titulo, s.nome, u.nome
    LIMIT 5;
    "
fi
echo ""

# 8. Verificar usuários e suas empresas
echo -e "${YELLOW}👤 8. Verificando usuários e suas empresas...${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  u.id,
  u.nome,
  u.email,
  u.empresa_id
FROM usuarios u
LIMIT 5;
"
echo ""

# 9. Verificar estrutura da tabela empresas
echo -e "${YELLOW}🏢 9. Verificando estrutura da tabela empresas...${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'empresas'
ORDER BY ordinal_position;
"
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Diagnóstico Concluído${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}💡 Próximos passos:${NC}"
echo -e "1. Verifique se há avaliações para a empresa_id do usuário logado"
echo -e "2. Verifique se os perigos estão sendo classificados (identificado = true)"
echo -e "3. Verifique se há classificações de risco associadas aos perigos"
echo ""
