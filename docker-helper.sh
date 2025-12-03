#!/bin/bash

# Docker Helper Script - Sistema de Gestão Ergonômica
# Facilita operações comuns com Docker

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Funções principais
show_help() {
    cat << EOF
Uso: ./docker-helper.sh [comando]

Comandos disponíveis:

  Gerenciamento:
    start           - Iniciar todos os containers
    stop            - Parar todos os containers
    restart         - Reiniciar todos os containers
    rebuild         - Rebuild e reiniciar
    status          - Ver status dos containers
    logs            - Ver logs de todos os serviços
    clean           - Limpar containers e imagens não utilizadas

  Desenvolvimento:
    dev             - Iniciar em modo desenvolvimento
    build           - Build das imagens
    shell-backend   - Shell no container backend
    shell-frontend  - Shell no container frontend
    shell-db        - Shell no PostgreSQL

  Banco de Dados:
    migrate         - Executar migrations
    backup          - Fazer backup do banco
    restore         - Restaurar backup do banco
    psql            - Acessar console do PostgreSQL
    reset-db        - Resetar banco de dados (CUIDADO!)

  Monitoramento:
    health          - Verificar saúde dos containers
    stats           - Ver uso de recursos
    inspect         - Inspecionar container

  Utilitários:
    generate-jwt    - Gerar chaves JWT
    check-env       - Verificar arquivo .env
    test-api        - Testar API do backend

Exemplos:
  ./docker-helper.sh start
  ./docker-helper.sh logs backend
  ./docker-helper.sh backup
  ./docker-helper.sh shell-db

EOF
}

# Comandos de gerenciamento
cmd_start() {
    print_header "Iniciando containers"
    docker compose up -d
    print_success "Containers iniciados"
    cmd_status
}

cmd_stop() {
    print_header "Parando containers"
    docker compose down
    print_success "Containers parados"
}

cmd_restart() {
    print_header "Reiniciando containers"
    docker compose restart
    print_success "Containers reiniciados"
    cmd_status
}

cmd_rebuild() {
    print_header "Rebuild e reiniciando"
    docker compose down
    docker compose up -d --build
    print_success "Rebuild concluído"
    cmd_status
}

cmd_status() {
    print_header "Status dos containers"
    docker compose ps
}

cmd_logs() {
    SERVICE=${2:-}
    if [ -z "$SERVICE" ]; then
        print_info "Mostrando logs de todos os serviços"
        docker compose logs -f --tail=100
    else
        print_info "Mostrando logs de: $SERVICE"
        docker compose logs -f --tail=100 "$SERVICE"
    fi
}

cmd_clean() {
    print_header "Limpando containers e imagens não utilizadas"
    print_warning "Isso irá remover containers parados e imagens não utilizadas"
    read -p "Continuar? (s/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        docker system prune -af
        print_success "Limpeza concluída"
    else
        print_info "Operação cancelada"
    fi
}

# Comandos de desenvolvimento
cmd_dev() {
    print_header "Iniciando em modo desenvolvimento"
    docker compose up --build
}

cmd_build() {
    print_header "Build das imagens"
    docker compose build
    print_success "Build concluído"
}

cmd_shell_backend() {
    print_info "Acessando shell do backend"
    docker compose exec backend sh
}

cmd_shell_frontend() {
    print_info "Acessando shell do frontend"
    docker compose exec frontend sh
}

cmd_shell_db() {
    print_info "Acessando shell do PostgreSQL"
    docker compose exec postgres sh
}

# Comandos de banco de dados
cmd_migrate() {
    print_header "Executando migrations"

    print_info "Migration 001: Initial Schema"
    docker compose exec -T postgres psql -U ergonomia_user -d ergonomia_db < backend/migrations/001_initial_schema.sql

    print_info "Migration 002: Planos de Ação"
    docker compose exec -T postgres psql -U ergonomia_user -d ergonomia_db < backend/migrations/002_planos_acao.sql

    print_info "Migration 003: Remover Trabalhadores"
    docker compose exec -T postgres psql -U ergonomia_user -d ergonomia_db < backend/migrations/003_remover_trabalhadores.sql

    print_success "Migrations executadas com sucesso"
}

cmd_backup() {
    print_header "Fazendo backup do banco de dados"
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql.gz"

    docker compose exec postgres pg_dump -U ergonomia_user ergonomia_db | gzip > "$BACKUP_FILE"

    print_success "Backup criado: $BACKUP_FILE"
}

cmd_restore() {
    BACKUP_FILE=${2:-}

    if [ -z "$BACKUP_FILE" ]; then
        print_error "Forneça o arquivo de backup"
        echo "Uso: ./docker-helper.sh restore <arquivo.sql.gz>"
        exit 1
    fi

    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Arquivo não encontrado: $BACKUP_FILE"
        exit 1
    fi

    print_header "Restaurando backup do banco de dados"
    print_warning "CUIDADO: Isso irá SUBSTITUIR todos os dados atuais!"
    read -p "Continuar? (s/N) " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Ss]$ ]]; then
        gunzip < "$BACKUP_FILE" | docker compose exec -T postgres psql -U ergonomia_user -d ergonomia_db
        print_success "Backup restaurado com sucesso"
    else
        print_info "Operação cancelada"
    fi
}

cmd_psql() {
    print_info "Acessando console do PostgreSQL"
    docker compose exec postgres psql -U ergonomia_user -d ergonomia_db
}

cmd_reset_db() {
    print_header "Resetar banco de dados"
    print_warning "ATENÇÃO: Isso irá APAGAR TODOS OS DADOS!"
    read -p "Tem certeza? Digite 'CONFIRMO' para continuar: " confirmation

    if [ "$confirmation" = "CONFIRMO" ]; then
        docker compose down
        docker volume rm ergonomia_postgres-data 2>/dev/null || true
        docker compose up -d
        sleep 5
        cmd_migrate
        print_success "Banco de dados resetado"
    else
        print_info "Operação cancelada"
    fi
}

# Comandos de monitoramento
cmd_health() {
    print_header "Verificando saúde dos containers"

    for container in ergonomia-postgres ergonomia-backend ergonomia-frontend; do
        health=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "não disponível")

        if [ "$health" = "healthy" ]; then
            print_success "$container: $health"
        elif [ "$health" = "unhealthy" ]; then
            print_error "$container: $health"
        else
            print_warning "$container: $health"
        fi
    done
}

cmd_stats() {
    print_header "Uso de recursos"
    docker stats --no-stream
}

cmd_inspect() {
    CONTAINER=${2:-ergonomia-backend}
    print_info "Inspecionando container: $CONTAINER"
    docker inspect "$CONTAINER"
}

# Comandos utilitários
cmd_generate_jwt() {
    print_header "Gerando chaves JWT"

    print_info "JWT_SECRET:"
    node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

    echo ""
    print_info "JWT_REFRESH_SECRET:"
    node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
}

cmd_check_env() {
    print_header "Verificando arquivo .env"

    if [ ! -f .env ]; then
        print_error "Arquivo .env não encontrado"
        print_info "Crie um arquivo .env baseado em .env.docker.example"
        exit 1
    fi

    # Verificar variáveis obrigatórias
    required_vars=("DB_PASSWORD" "JWT_SECRET" "JWT_REFRESH_SECRET")

    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" .env && ! grep -q "^${var}=.*ALTERAR\|GERAR" .env; then
            print_success "$var configurado"
        else
            print_error "$var não configurado ou com valor padrão"
        fi
    done
}

cmd_test_api() {
    print_header "Testando API"

    print_info "Testando endpoint de health..."
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health || echo "000")

    if [ "$response" = "200" ]; then
        print_success "API respondendo corretamente (HTTP $response)"
    else
        print_error "API não está respondendo (HTTP $response)"
    fi
}

# Main
main() {
    case "${1:-help}" in
        start)
            cmd_start
            ;;
        stop)
            cmd_stop
            ;;
        restart)
            cmd_restart
            ;;
        rebuild)
            cmd_rebuild
            ;;
        status)
            cmd_status
            ;;
        logs)
            cmd_logs "$@"
            ;;
        clean)
            cmd_clean
            ;;
        dev)
            cmd_dev
            ;;
        build)
            cmd_build
            ;;
        shell-backend)
            cmd_shell_backend
            ;;
        shell-frontend)
            cmd_shell_frontend
            ;;
        shell-db)
            cmd_shell_db
            ;;
        migrate)
            cmd_migrate
            ;;
        backup)
            cmd_backup
            ;;
        restore)
            cmd_restore "$@"
            ;;
        psql)
            cmd_psql
            ;;
        reset-db)
            cmd_reset_db
            ;;
        health)
            cmd_health
            ;;
        stats)
            cmd_stats
            ;;
        inspect)
            cmd_inspect "$@"
            ;;
        generate-jwt)
            cmd_generate_jwt
            ;;
        check-env)
            cmd_check_env
            ;;
        test-api)
            cmd_test_api
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Comando desconhecido: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
