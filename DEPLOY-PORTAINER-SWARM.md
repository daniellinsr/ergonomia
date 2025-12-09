# 🚀 Deploy via Portainer - Docker Swarm

Este guia é para quando seu servidor está usando **Docker Swarm mode**.

## 📋 Pré-requisitos

- ✅ Docker Swarm inicializado
- ✅ Traefik rodando no Swarm
- ✅ Rede `web` criada no Swarm
- ✅ Portainer conectado ao Swarm

## 🔍 Verificar se é Swarm

```bash
# Via SSH no servidor
docker info | grep -i swarm

# Se retornar "Swarm: active", você está usando Swarm
# Se retornar "Swarm: inactive", use o guia normal
```

## 🛠️ Passo 1: Preparar Imagens (Via SSH)

### 1.1 Clonar repositório

```bash
ssh usuario@seu-servidor.com.br

sudo mkdir -p /opt/apps
cd /opt/apps
sudo git clone https://github.com/daniellinsr/ergonomia.git
cd ergonomia
```

### 1.2 Build das imagens

```bash
# Build backend
cd backend
sudo docker build -t ergonomia-backend:latest .

# Build frontend
cd ../frontend
sudo docker build -t ergonomia-frontend:latest --build-arg VITE_API_URL=/api .

cd ..
```

## 🌐 Passo 2: Garantir que a rede 'web' está no Swarm

```bash
# Verificar redes no Swarm
docker network ls --filter driver=overlay

# Se a rede 'web' não existir como overlay, criar:
docker network create --driver overlay --attachable web
```

## 📦 Passo 3: Deploy via Portainer

### 3.1 Acessar Portainer

1. Acesse: `https://portainer.helthcorp.com.br`
2. Selecione o **endpoint** correto (seu cluster Swarm)

### 3.2 Criar Stack

1. **Stacks** → **+ Add stack**
2. **Name:** `ergonomia`
3. **Build method:** **Web editor**

### 3.3 Colar Docker Compose (versão Swarm)

Cole este conteúdo:

```yaml
version: '3.8'

networks:
  ergonomia-network:
    driver: overlay
  web:
    external: true

volumes:
  postgres-data:
  postgres-backups:

services:
  postgres:
    image: postgres:18-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_INITDB_ARGS: "-E UTF8 --locale=pt_BR.UTF-8"
      TZ: America/Sao_Paulo
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - postgres-backups:/backups
    networks:
      - ergonomia-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager

  backend:
    image: ergonomia-backend:latest
    depends_on:
      - postgres
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      JWT_REFRESH_EXPIRES_IN: ${JWT_REFRESH_EXPIRES_IN}
      FRONTEND_URL: ${FRONTEND_URL}
      RATE_LIMIT_WINDOW_MS: ${RATE_LIMIT_WINDOW_MS}
      RATE_LIMIT_MAX_REQUESTS: ${RATE_LIMIT_MAX_REQUESTS}
      TZ: America/Sao_Paulo
    networks:
      - ergonomia-network
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager

  frontend:
    image: ergonomia-frontend:latest
    depends_on:
      - backend
    environment:
      TZ: America/Sao_Paulo
    networks:
      - ergonomia-network
      - web
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      labels:
        - "traefik.enable=true"
        - "traefik.docker.network=web"
        - "traefik.http.routers.ergonomia.rule=Host(`${TRAEFIK_HOST}`)"
        - "traefik.http.routers.ergonomia.entrypoints=websecure"
        - "traefik.http.routers.ergonomia.tls=true"
        - "traefik.http.routers.ergonomia.tls.certresolver=lets-encrypt"
        - "traefik.http.services.ergonomia.loadbalancer.server.port=80"
        - "traefik.http.middlewares.ergonomia-redirect.redirectscheme.scheme=https"
        - "traefik.http.routers.ergonomia-http.rule=Host(`${TRAEFIK_HOST}`)"
        - "traefik.http.routers.ergonomia-http.entrypoints=web"
        - "traefik.http.routers.ergonomia-http.middlewares=ergonomia-redirect"

  postgres-backup:
    image: prodrigestivill/postgres-backup-local:18-alpine
    depends_on:
      - postgres
    environment:
      POSTGRES_HOST: postgres
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      SCHEDULE: "@daily"
      BACKUP_KEEP_DAYS: 7
      BACKUP_KEEP_WEEKS: 4
      BACKUP_KEEP_MONTHS: 6
      TZ: America/Sao_Paulo
    volumes:
      - postgres-backups:/backups
    networks:
      - ergonomia-network
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
```

### 3.4 Variáveis de Ambiente

Clique em **Environment variables** → **Advanced mode**:

```env
DB_NAME=ergonomia_db
DB_USER=ergonomia_user
DB_PASSWORD=SuaSenhaForteDoBanco123!
JWT_SECRET=sua_chave_jwt_64_caracteres_aqui
JWT_EXPIRES_IN=8h
JWT_REFRESH_SECRET=outra_chave_jwt_64_caracteres_aqui
JWT_REFRESH_EXPIRES_IN=7d
TRAEFIK_HOST=ergonomia.helthcorp.com.br
FRONTEND_URL=https://ergonomia.helthcorp.com.br
VITE_API_URL=/api
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
```

**Gerar chaves JWT:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3.5 Deploy

Clique em **Deploy the stack**

## 🔄 Passo 4: Aguardar Inicialização

No Docker Swarm, os serviços levam mais tempo para iniciar.

Aguarde ~2-3 minutos e verifique:

### Via Portainer

1. **Stacks** → `ergonomia`
2. Expandir serviços
3. Todos devem estar **1/1** (running)

### Via SSH

```bash
# Ver todos os serviços
docker service ls | grep ergonomia

# Ver status detalhado
docker service ps ergonomia_postgres
docker service ps ergonomia_backend
docker service ps ergonomia_frontend
docker service ps ergonomia_postgres-backup
```

## 💾 Passo 5: Executar Migration

### Encontrar o container do postgres

```bash
# Listar containers
docker ps | grep postgres

# Ou via service
POSTGRES_CONTAINER=$(docker ps -q -f name=ergonomia_postgres)
echo $POSTGRES_CONTAINER
```

### Executar migration

```bash
docker exec -i $POSTGRES_CONTAINER psql -U ergonomia_user -d ergonomia_db < /opt/apps/ergonomia/backend/migrations/001_initial_schema.sql
```

**OU via Portainer:**

1. **Containers** → Encontre o container `ergonomia_postgres.1.xxxxx`
2. **Console** → **Connect**
3. Execute:

```bash
psql -U ergonomia_user -d ergonomia_db
```

Cole o conteúdo do arquivo `001_initial_schema.sql`

## ✅ Passo 6: Verificar

### Acessar aplicação

Acesse: `https://ergonomia.helthcorp.com.br`

**Login inicial:**
- Email: `admin@sistema.com`
- Senha: `admin123`

### Verificar logs

```bash
# Logs do backend
docker service logs ergonomia_backend -f

# Logs do frontend
docker service logs ergonomia_frontend -f

# Logs do postgres
docker service logs ergonomia_postgres --tail 50
```

## 🔄 Atualização

### Via SSH

```bash
cd /opt/apps/ergonomia
git pull

# Rebuild imagens
docker build -t ergonomia-backend:latest backend/
docker build -t ergonomia-frontend:latest --build-arg VITE_API_URL=/api frontend/

# Atualizar serviços (força uso das novas imagens)
docker service update --force ergonomia_backend
docker service update --force ergonomia_frontend
```

### Via Portainer

1. **Stacks** → `ergonomia`
2. **Editor** (se necessário atualizar compose)
3. **Update the stack**

## 🐛 Troubleshooting

### Erro: "network not in the right scope"

**Solução:** Criar rede overlay

```bash
docker network rm web
docker network create --driver overlay --attachable web
```

### Serviços não iniciam

**Verificar:**

```bash
# Ver réplicas
docker service ls

# Ver erros
docker service ps ergonomia_backend --no-trunc

# Ver logs
docker service logs ergonomia_backend --tail 100
```

### Backend não conecta ao banco

**Aguardar 2-3 minutos.** O Swarm leva mais tempo para estabilizar.

```bash
# Verificar postgres
docker service ps ergonomia_postgres

# Logs do backend
docker service logs ergonomia_backend -f
```

### Containers em loop (restart)

**Verificar variáveis de ambiente:**

```bash
# Inspecionar serviço
docker service inspect ergonomia_backend --format '{{json .Spec.TaskTemplate.ContainerSpec.Env}}' | jq
```

### Escalar serviço (se necessário)

```bash
# Aumentar réplicas do frontend
docker service scale ergonomia_frontend=2

# Voltar para 1
docker service scale ergonomia_frontend=1
```

## 📊 Monitoramento

### Ver status dos serviços

```bash
docker service ls
```

### Ver onde os containers estão rodando

```bash
docker service ps ergonomia_frontend
docker service ps ergonomia_backend
```

### Ver uso de recursos

```bash
docker stats
```

## ⚠️ Diferenças entre Swarm e Standalone

| Feature | Standalone | Swarm |
|---------|------------|-------|
| Rede padrão | `bridge` | `overlay` |
| Restart policy | `restart: unless-stopped` | `deploy.restart_policy` |
| Labels | No serviço | Em `deploy.labels` |
| Escalabilidade | Não | Sim (replicas) |
| Multi-node | Não | Sim |

## 🔒 Segurança no Swarm

### Segredos (Secrets) - Opcional

Para maior segurança, use Docker Secrets:

```bash
# Criar secret para senha do banco
echo "SenhaSuperForte123!" | docker secret create db_password -

# No compose, usar:
# secrets:
#   - db_password
# environment:
#   POSTGRES_PASSWORD_FILE: /run/secrets/db_password
```

## 📚 Recursos

- **Docker Swarm:** https://docs.docker.com/engine/swarm/
- **Portainer Swarm:** https://docs.portainer.io/user/docker/swarm
- **Compose Swarm:** https://docs.docker.com/compose/compose-file/deploy/

---

**Deploy no Swarm concluído!** 🎉

Próximo: Alterar senha admin e configurar sistema.
