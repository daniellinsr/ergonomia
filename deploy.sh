#!/bin/bash

# Script de Deploy Automatizado - Sistema de Gestão Ergonômica
# Uso: ./deploy.sh [frontend|backend|full]

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações (ajuste conforme necessário)
SERVER_USER="deploy"
SERVER_IP="SEU_IP_DA_VPS"
SERVER_PATH="/var/www/ergonomia"
PM2_APP_NAME="ergonomia-backend"

# Funções auxiliares
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

# Verificar se SSH funciona
check_ssh() {
    print_info "Verificando conexão SSH..."
    if ssh -q ${SERVER_USER}@${SERVER_IP} exit; then
        print_success "Conexão SSH estabelecida"
    else
        print_error "Falha na conexão SSH"
        exit 1
    fi
}

# Deploy do Backend
deploy_backend() {
    print_info "Iniciando deploy do backend..."

    # Criar backup do backend atual
    print_info "Criando backup do backend atual..."
    ssh ${SERVER_USER}@${SERVER_IP} "cd ${SERVER_PATH} && \
        if [ -d backend ]; then \
            cp -r backend backend.backup.$(date +%Y%m%d_%H%M%S); \
        fi"
    print_success "Backup criado"

    # Enviar código do backend
    print_info "Enviando arquivos do backend..."
    rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude '.env' \
        --exclude '*.log' \
        ./backend/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/backend/
    print_success "Arquivos enviados"

    # Instalar dependências e reiniciar
    print_info "Instalando dependências e reiniciando..."
    ssh ${SERVER_USER}@${SERVER_IP} "cd ${SERVER_PATH}/backend && \
        npm install --production && \
        pm2 restart ${PM2_APP_NAME}"
    print_success "Backend reiniciado"

    # Verificar se está rodando
    print_info "Verificando status..."
    ssh ${SERVER_USER}@${SERVER_IP} "pm2 status ${PM2_APP_NAME}"
    print_success "Deploy do backend concluído!"
}

# Deploy do Frontend
deploy_frontend() {
    print_info "Iniciando deploy do frontend..."

    # Build local
    print_info "Fazendo build do frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
    print_success "Build concluído"

    # Criar backup do frontend atual
    print_info "Criando backup do frontend atual..."
    ssh ${SERVER_USER}@${SERVER_IP} "cd ${SERVER_PATH} && \
        if [ -d frontend ]; then \
            cp -r frontend frontend.backup.$(date +%Y%m%d_%H%M%S); \
        fi"
    print_success "Backup criado"

    # Enviar build
    print_info "Enviando arquivos do frontend..."
    rsync -avz --delete \
        ./frontend/dist/ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/frontend/
    print_success "Arquivos enviados"

    # Recarregar Nginx
    print_info "Recarregando Nginx..."
    ssh ${SERVER_USER}@${SERVER_IP} "sudo systemctl reload nginx"
    print_success "Nginx recarregado"

    print_success "Deploy do frontend concluído!"
}

# Deploy completo
deploy_full() {
    print_info "Iniciando deploy completo..."
    deploy_backend
    deploy_frontend
    print_success "Deploy completo finalizado!"
}

# Main
main() {
    echo ""
    echo "=========================================="
    echo "  Deploy - Sistema de Gestão Ergonômica"
    echo "=========================================="
    echo ""

    check_ssh

    case "${1}" in
        backend)
            deploy_backend
            ;;
        frontend)
            deploy_frontend
            ;;
        full)
            deploy_full
            ;;
        *)
            echo "Uso: $0 {backend|frontend|full}"
            echo ""
            echo "  backend  - Deploy apenas do backend"
            echo "  frontend - Deploy apenas do frontend"
            echo "  full     - Deploy completo (backend + frontend)"
            exit 1
            ;;
    esac

    echo ""
    print_success "✨ Deploy finalizado com sucesso!"
    echo ""
}

main "$@"
