#!/bin/bash

# Script para criar empresa e usuário administrador inicial
# Uso: ./create-admin.sh

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Criar Usuário Admin - Ergonomia${NC}"
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
POSTGRES_CONTAINER=$(docker ps --filter "name=ergonomia_postgres" --format "{{.Names}}" | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo -e "${RED}❌ Erro: Container PostgreSQL não encontrado!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL encontrado: $POSTGRES_CONTAINER${NC}"
echo ""

# Gerar hash da senha usando bcrypt via Node.js no container backend
echo -e "${YELLOW}🔐 Gerando hash da senha...${NC}"
BACKEND_CONTAINER=$(docker ps --filter "name=ergonomia_backend" --format "{{.Names}}" | head -1)

if [ -z "$BACKEND_CONTAINER" ]; then
    echo -e "${RED}❌ Erro: Container backend não encontrado!${NC}"
    exit 1
fi

# Senha padrão: Admin@123
PASSWORD_HASH=$(docker exec $BACKEND_CONTAINER node -e "const bcrypt = require('bcrypt'); bcrypt.hash('Admin@123', 10).then(console.log);")

echo -e "${GREEN}✅ Hash gerado${NC}"
echo ""

# SQL para criar empresa e usuário admin
echo -e "${YELLOW}📝 Criando empresa e usuário admin...${NC}"

SQL="
-- Criar empresa padrão se não existir
DO \$\$
DECLARE
    v_empresa_id UUID;
    v_usuario_existe BOOLEAN;
BEGIN
    -- Verificar se já existe uma empresa
    SELECT id INTO v_empresa_id FROM empresas LIMIT 1;

    -- Se não existir, criar empresa padrão
    IF v_empresa_id IS NULL THEN
        INSERT INTO empresas (cnpj, razao_social, nome_fantasia, email, ativo)
        VALUES ('00.000.000/0000-00', 'Empresa Padrão', 'Sistema', 'admin@sistema.com', true)
        RETURNING id INTO v_empresa_id;

        RAISE NOTICE 'Empresa criada com ID: %', v_empresa_id;
    ELSE
        RAISE NOTICE 'Empresa já existe com ID: %', v_empresa_id;
    END IF;

    -- Verificar se usuário admin já existe
    SELECT EXISTS(SELECT 1 FROM usuarios WHERE email = 'admin@sistema.com') INTO v_usuario_existe;

    IF NOT v_usuario_existe THEN
        -- Criar usuário admin
        INSERT INTO usuarios (empresa_id, nome, email, senha_hash, perfil, ativo)
        VALUES (v_empresa_id, 'Administrador', 'admin@sistema.com', '$PASSWORD_HASH', 'administrador', true);

        RAISE NOTICE 'Usuário admin criado com sucesso!';
    ELSE
        RAISE NOTICE 'Usuário admin já existe!';
    END IF;
END \$\$;
"

docker exec -i $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "$SQL"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Configuração concluída!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📋 Credenciais de acesso:${NC}"
echo -e "${GREEN}  Email:    admin@sistema.com${NC}"
echo -e "${GREEN}  Senha:    Admin@123${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Altere a senha após o primeiro login!${NC}"
echo ""
