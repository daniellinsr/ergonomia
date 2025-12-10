#!/bin/bash

# Script para popular o banco com dados de teste para relatórios

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Popular Dados de Teste${NC}"
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

echo -e "${YELLOW}⚠️  ATENÇÃO: Este script irá popular o banco com dados de teste.${NC}"
echo -e "${YELLOW}Pressione CTRL+C para cancelar ou Enter para continuar...${NC}"
read

echo -e "${YELLOW}📝 Verificando estrutura existente...${NC}"

# Verificar se já existem avaliações
AVALIACOES_COUNT=$(docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM avaliacoes_ergonomicas;")

if [ "$AVALIACOES_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Já existem $AVALIACOES_COUNT avaliações no banco.${NC}"
    echo -e "${YELLOW}Deseja continuar e adicionar mais dados de teste? (s/n)${NC}"
    read CONTINUAR
    if [ "$CONTINUAR" != "s" ]; then
        echo -e "${RED}❌ Operação cancelada.${NC}"
        exit 0
    fi
fi

echo ""
echo -e "${YELLOW}🔍 1. Buscando informações necessárias...${NC}"

# Buscar empresa_id
EMPRESA_ID=$(docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT id FROM empresas LIMIT 1;" | xargs)

if [ -z "$EMPRESA_ID" ]; then
    echo -e "${RED}❌ Erro: Nenhuma empresa encontrada.${NC}"
    echo -e "${YELLOW}Execute primeiro o sistema para criar uma empresa.${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Empresa ID: $EMPRESA_ID${NC}"

# Buscar usuario_id
USUARIO_ID=$(docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT id FROM usuarios WHERE empresa_id = '$EMPRESA_ID'::uuid LIMIT 1;" | xargs)

if [ -z "$USUARIO_ID" ]; then
    echo -e "${RED}❌ Erro: Nenhum usuário encontrado para esta empresa.${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Usuário ID: $USUARIO_ID${NC}"

# Buscar setor_id
SETOR_ID=$(docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT s.id
FROM setores s
JOIN unidades u ON s.unidade_id = u.id
WHERE u.empresa_id = '$EMPRESA_ID'::uuid
LIMIT 1;" | xargs)

if [ -z "$SETOR_ID" ]; then
    echo -e "${RED}❌ Erro: Nenhum setor encontrado para esta empresa.${NC}"
    echo -e "${YELLOW}Execute primeiro o sistema para criar uma unidade e setor.${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Setor ID: $SETOR_ID${NC}"

echo ""
echo -e "${YELLOW}📋 2. Criando avaliações de teste...${NC}"

# Criar 3 avaliações de teste
for i in {1..3}; do
    echo -e "${YELLOW}  Criando avaliação $i/3...${NC}"

    docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
    INSERT INTO avaliacoes_ergonomicas (
      empresa_id,
      usuario_id,
      setor_id,
      titulo,
      descricao,
      tipo_avaliacao,
      data_avaliacao,
      status,
      created_at,
      updated_at
    ) VALUES (
      '$EMPRESA_ID'::uuid,
      '$USUARIO_ID'::uuid,
      '$SETOR_ID'::uuid,
      'Avaliação de Teste $i',
      'Avaliação criada automaticamente para testes de relatórios',
      'AET',
      CURRENT_DATE - INTERVAL '$i days',
      'finalizada',
      NOW(),
      NOW()
    );
    " > /dev/null

    echo -e "${GREEN}  ✓ Avaliação $i criada${NC}"
done

echo ""
echo -e "${YELLOW}⚠️  3. Buscando perigos do catálogo...${NC}"

# Buscar IDs de perigos
PERIGOS=$(docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT id FROM perigos_catalogo LIMIT 10;
")

if [ -z "$PERIGOS" ]; then
    echo -e "${RED}❌ Erro: Nenhum perigo encontrado no catálogo.${NC}"
    echo -e "${YELLOW}Execute a migration 008 para popular o catálogo de perigos.${NC}"
    exit 1
fi

echo -e "${GREEN}  ✓ Encontrados perigos no catálogo${NC}"

echo ""
echo -e "${YELLOW}🔗 4. Associando perigos às avaliações...${NC}"

# Buscar IDs das avaliações criadas
AVALIACOES=$(docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT id FROM avaliacoes_ergonomicas WHERE titulo LIKE 'Avaliação de Teste%' ORDER BY id DESC LIMIT 3;
")

for AVALIACAO_ID in $AVALIACOES; do
    echo -e "${YELLOW}  Processando avaliação ID: $AVALIACAO_ID${NC}"

    # Adicionar 5 perigos identificados para cada avaliação
    COUNTER=0
    for PERIGO_ID in $PERIGOS; do
        if [ $COUNTER -ge 5 ]; then
            break
        fi

        # Inserir perigo identificado
        PI_ID=$(docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        INSERT INTO perigos_identificados (avaliacao_id, perigo_id, identificado)
        VALUES ($AVALIACAO_ID, $PERIGO_ID, true)
        RETURNING id;
        " | xargs)

        # Criar classificação de risco aleatória
        CLASSIFICACOES=("Intolerável" "Substancial" "Moderado" "Tolerável" "Trivial")
        NIVEIS=(5 4 3 2 1)
        RAND_INDEX=$((COUNTER % 5))
        CLASSIFICACAO=${CLASSIFICACOES[$RAND_INDEX]}
        NIVEL=${NIVEIS[$RAND_INDEX]}

        docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
        INSERT INTO classificacao_risco (
          perigo_identificado_id,
          severidade,
          frequencia,
          numero_expostos,
          classificacao_final,
          nivel_risco,
          created_at,
          updated_at
        ) VALUES (
          $PI_ID,
          $((RAND_INDEX + 1)),
          $((RAND_INDEX + 1)),
          10,
          '$CLASSIFICACAO',
          $NIVEL,
          NOW(),
          NOW()
        );
        " > /dev/null

        COUNTER=$((COUNTER + 1))
    done

    echo -e "${GREEN}  ✓ Adicionados 5 perigos com classificações${NC}"
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Dados de Teste Criados!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo -e "${YELLOW}📊 Resumo:${NC}"
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  COUNT(DISTINCT a.id) as avaliacoes_criadas,
  COUNT(DISTINCT pi.id) as perigos_identificados,
  COUNT(DISTINCT cr.id) as classificacoes_criadas
FROM avaliacoes_ergonomicas a
LEFT JOIN perigos_identificados pi ON a.id = pi.avaliacao_id
LEFT JOIN classificacao_risco cr ON pi.id = cr.perigo_identificado_id
WHERE a.titulo LIKE 'Avaliação de Teste%';
"

echo ""
echo -e "${YELLOW}💡 Próximo passo: Acesse os relatórios e verifique se os dados aparecem!${NC}"
echo ""
