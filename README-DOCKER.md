# Sistema de Gestão Ergonômica - Deploy com Docker

Sistema completo de gestão ergonômica com arquitetura de containers Docker.

## 📦 Estrutura do Projeto

```
ergonomia/
├── backend/
│   ├── src/
│   ├── migrations/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .dockerignore
│   └── package.json
├── docker-compose.yml
├── .env.docker.example
├── DEPLOYMENT-PORTAINER.md
└── QUICK-START-PORTAINER.md
```

## 🐳 Arquitetura Docker

O sistema é composto por 4 containers principais:

1. **PostgreSQL** - Banco de dados
   - Imagem: `postgres:15-alpine`
   - Porta: 5432
   - Volume: `postgres-data` (dados persistentes)

2. **Backend** - API Node.js/Express
   - Build: `backend/Dockerfile`
   - Porta: 3001
   - Healthcheck: `/api/health`

3. **Frontend** - React + Vite + Nginx
   - Build: `frontend/Dockerfile`
   - Porta: 80
   - Servido via Nginx

4. **Backup** - Backup automático do PostgreSQL
   - Imagem: `prodrigestivill/postgres-backup-local`
   - Frequência: Diário
   - Retenção: 7 dias

## 🚀 Deploy Rápido

### Pré-requisitos

- Docker 24.0+
- Docker Compose 2.20+
- Mínimo 2GB RAM
- Portainer (opcional, mas recomendado)

### Opção 1: Deploy Local (Desenvolvimento)

```bash
# Clonar projeto
git clone SEU_REPOSITORIO ergonomia
cd ergonomia

# Criar arquivo .env
cp .env.docker.example .env

# Editar .env com suas credenciais
nano .env

# Iniciar containers
docker compose up -d --build

# Ver logs
docker compose logs -f

# Acessar
# Frontend: http://localhost
# Backend: http://localhost:3001
# Portainer: http://localhost:9000
```

### Opção 2: Deploy em Produção via Portainer

Siga o guia: [DEPLOYMENT-PORTAINER.md](DEPLOYMENT-PORTAINER.md)

Ou guia rápido: [QUICK-START-PORTAINER.md](QUICK-START-PORTAINER.md)

## 🔧 Configuração

### Variáveis de Ambiente

Copie `.env.docker.example` para `.env` e configure:

```env
# Database
DB_NAME=ergonomia_db
DB_USER=ergonomia_user
DB_PASSWORD=sua_senha_forte

# JWT (gerar com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=chave_secreta_64_caracteres
JWT_REFRESH_SECRET=outra_chave_secreta_64_caracteres

# URLs
FRONTEND_URL=https://ergonomia.helthcorp.com.br
VITE_API_URL=/api
```

### Gerar Chaves JWT

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📝 Comandos Úteis

### Gerenciamento de Containers

```bash
# Iniciar todos os serviços
docker compose up -d

# Parar todos os serviços
docker compose down

# Rebuild e reiniciar
docker compose up -d --build

# Ver status
docker compose ps

# Ver logs
docker compose logs -f [service_name]

# Reiniciar serviço específico
docker compose restart backend
```

### Banco de Dados

```bash
# Acessar PostgreSQL
docker compose exec postgres psql -U ergonomia_user -d ergonomia_db

# Executar migration
docker compose exec -T postgres psql -U ergonomia_user -d ergonomia_db < backend/migrations/001_initial_schema.sql

# Fazer backup
docker compose exec postgres pg_dump -U ergonomia_user ergonomia_db | gzip > backup_$(date +%Y%m%d).sql.gz

# Restaurar backup
gunzip < backup.sql.gz | docker compose exec -T postgres psql -U ergonomia_user -d ergonomia_db

# Ver backups automáticos
docker compose exec postgres-backup ls -lh /backups
```

### Debug

```bash
# Executar shell no container
docker compose exec backend sh
docker compose exec frontend sh

# Ver logs em tempo real
docker compose logs -f backend
docker compose logs -f frontend

# Ver uso de recursos
docker stats

# Inspecionar container
docker inspect ergonomia-backend
```

## 🔄 Atualização da Aplicação

### Via Git

```bash
# Atualizar código
git pull

# Rebuild containers
docker compose up -d --build
```

### Via Portainer

1. Stacks → ergonomia
2. Editor → colar novo docker-compose.yml
3. Update the stack
4. ✅ Re-pull image and redeploy

## 🔙 Rollback

```bash
# Parar containers
docker compose down

# Reverter código (Git)
git checkout COMMIT_ANTERIOR

# Rebuild
docker compose up -d --build
```

## 📊 Monitoramento

### Healthchecks

Todos os containers têm healthchecks configurados:

- **PostgreSQL**: `pg_isready`
- **Backend**: `GET /api/health`
- **Frontend**: `GET /`

```bash
# Ver status de saúde
docker compose ps

# Ver detalhes do healthcheck
docker inspect ergonomia-backend | grep -A 10 Health
```

### Logs

```bash
# Ver todos os logs
docker compose logs

# Filtrar por serviço
docker compose logs backend

# Seguir logs em tempo real
docker compose logs -f

# Últimas 100 linhas
docker compose logs --tail=100
```

### Recursos

```bash
# Ver uso de CPU, memória, rede
docker stats

# Limitar recursos no docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
```

## 🔒 Segurança

### Boas Práticas Implementadas

✅ Containers rodando como usuário não-root
✅ Healthchecks em todos os serviços
✅ Volumes separados para dados e backups
✅ Secrets via variáveis de ambiente
✅ Networks isoladas
✅ Imagens Alpine (menores e mais seguras)
✅ Multi-stage builds
✅ .dockerignore para excluir arquivos sensíveis

### Melhorias Adicionais

```bash
# Escanear vulnerabilidades
docker scan ergonomia-backend

# Atualizar imagens base
docker compose pull
docker compose up -d

# Limpar imagens antigas
docker image prune -a
```

## 📦 Backup

### Backup Automático

O container `postgres-backup` faz backup automático:
- **Frequência**: Diário à meia-noite
- **Retenção**: 7 dias, 4 semanas, 6 meses
- **Localização**: Volume `postgres-backups`

```bash
# Ver backups
docker compose exec postgres-backup ls -lh /backups/daily

# Copiar backup para host
docker cp ergonomia-backup:/backups/daily/ergonomia_db-2024-01-01.sql.gz ./
```

### Backup Manual

```bash
# Backup completo
docker compose exec postgres pg_dump -U ergonomia_user ergonomia_db | gzip > backup.sql.gz

# Backup de volumes
docker run --rm -v ergonomia_postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-data-backup.tar.gz /data
```

## 🐛 Troubleshooting

### Container não inicia

```bash
# Ver logs de erro
docker compose logs [service_name]

# Verificar configuração
docker compose config

# Verificar portas
docker compose ps
netstat -tuln | grep LISTEN
```

### Erro de permissão

```bash
# Verificar permissões dos volumes
docker volume inspect postgres-data

# Resetar permissões
docker compose down
docker volume rm postgres-data
docker compose up -d
```

### Banco de dados não conecta

```bash
# Verificar se PostgreSQL está rodando
docker compose ps postgres

# Testar conexão
docker compose exec postgres pg_isready -U ergonomia_user

# Ver logs do PostgreSQL
docker compose logs postgres
```

### Limpar tudo e recomeçar

```bash
# CUIDADO: Remove TODOS os dados!
docker compose down -v
docker system prune -af --volumes

# Rebuild do zero
docker compose up -d --build
```

## 📚 Documentação Adicional

- [Guia Completo de Deploy - Portainer](DEPLOYMENT-PORTAINER.md)
- [Guia Rápido - Portainer](QUICK-START-PORTAINER.md)
- [Guia de Deploy - Tradicional](DEPLOYMENT.md)

## 🌐 URLs em Produção

- **Aplicação**: https://ergonomia.helthcorp.com.br
- **API**: https://ergonomia.helthcorp.com.br/api
- **Portainer**: https://SEU_IP:9443
- **Nginx Proxy Manager**: http://SEU_IP:81

## 📞 Suporte

- **Docker**: https://docs.docker.com/
- **Portainer**: https://docs.portainer.io/
- **PostgreSQL**: https://www.postgresql.org/docs/

## 📄 Licença

Propriedade de HealthCorp - Todos os direitos reservados.
