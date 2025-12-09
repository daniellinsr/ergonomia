# 🚀 Deploy via Portainer - Guia Atualizado

Existem **2 métodos** para fazer deploy via Portainer. Escolha o que preferir:

## 📊 Comparação dos Métodos

| Método | Vantagem | Desvantagem | Recomendado |
|--------|----------|-------------|-------------|
| **A: Upload Manual** | Mais rápido | Precisa fazer build local | ⭐⭐⭐ Sim |
| **B: Docker Hub** | Mais automatizado | Precisa conta Docker Hub | ⭐⭐ Alternativa |

---

# 🅰️ Método A: Upload Manual (RECOMENDADO)

Este é o método mais simples e direto.

## Passo 1: No Servidor (via SSH)

### 1.1 Clonar repositório

```bash
# Conectar ao servidor
ssh usuario@seu-servidor.com.br

# Criar diretório
sudo mkdir -p /opt/apps
cd /opt/apps

# Clonar repositório
sudo git clone https://github.com/daniellinsr/ergonomia.git
cd ergonomia
```

### 1.2 Fazer build das imagens

```bash
# Build do backend
cd backend
sudo docker build -t ergonomia-backend:latest .

# Build do frontend
cd ../frontend
sudo docker build -t ergonomia-frontend:latest --build-arg VITE_API_URL=/api .

# Voltar para raiz
cd ..
```

## Passo 2: No Portainer

### 2.1 Criar Stack

1. Acesse: `https://portainer.helthcorp.com.br`
2. **Stacks** → **+ Add stack**
3. **Name:** `ergonomia`
4. **Build method:** Selecione **Web editor**

### 2.2 Colar o Docker Compose

Cole este conteúdo no editor:

```yaml
version: '3.8'

networks:
  ergonomia-network:
    driver: bridge
  web:
    external: true

volumes:
  postgres-data:
  postgres-backups:

services:
  postgres:
    image: postgres:18-alpine
    restart: unless-stopped
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

  backend:
    image: ergonomia-backend:latest
    restart: unless-stopped
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

  frontend:
    image: ergonomia-frontend:latest
    restart: unless-stopped
    depends_on:
      - backend
    environment:
      TZ: America/Sao_Paulo
    networks:
      - ergonomia-network
      - web
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
    restart: unless-stopped
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
```

### 2.3 Configurar Variáveis de Ambiente

Clique em **Environment variables** → **Advanced mode** e cole:

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
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
```

**⚠️ IMPORTANTE:** Gere chaves JWT únicas:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2.4 Deploy

Clique em **Deploy the stack**

## Passo 3: Executar Migration

Aguarde ~30 segundos para os containers iniciarem, então:

### Via Portainer Console

1. **Containers** → `ergonomia-postgres`
2. **Console** → **Connect**
3. Execute:

```bash
psql -U ergonomia_user -d ergonomia_db
```

Depois, cole o conteúdo do arquivo `backend/migrations/001_initial_schema.sql`

### Via SSH

```bash
docker exec -i ergonomia-postgres psql -U ergonomia_user -d ergonomia_db < /opt/apps/ergonomia/backend/migrations/001_initial_schema.sql
```

## Passo 4: Acessar

Acesse: `https://ergonomia.helthcorp.com.br`

**Login inicial:**
- Email: `admin@sistema.com`
- Senha: `admin123`

---

# 🅱️ Método B: Via Docker Hub

Este método requer publicar as imagens no Docker Hub.

## Passo 1: Criar conta no Docker Hub

1. Acesse: https://hub.docker.com
2. Crie uma conta (grátis)
3. Faça login

## Passo 2: Build e Push (no seu computador ou servidor)

```bash
# Login no Docker Hub
docker login

# Clonar repositório
git clone https://github.com/daniellinsr/ergonomia.git
cd ergonomia

# Build e push do backend
cd backend
docker build -t SEU_USUARIO/ergonomia-backend:latest .
docker push SEU_USUARIO/ergonomia-backend:latest

# Build e push do frontend
cd ../frontend
docker build -t SEU_USUARIO/ergonomia-frontend:latest --build-arg VITE_API_URL=/api .
docker push SEU_USUARIO/ergonomia-frontend:latest
```

## Passo 3: No Portainer

Use o mesmo processo do **Método A**, mas:

1. No docker-compose, altere as imagens:
   ```yaml
   backend:
     image: SEU_USUARIO/ergonomia-backend:latest

   frontend:
     image: SEU_USUARIO/ergonomia-frontend:latest
   ```

2. Continue com os mesmos passos

---

# 🔄 Atualização da Aplicação

## Método A (Upload Manual)

```bash
# No servidor via SSH
cd /opt/apps/ergonomia

# Atualizar código
sudo git pull

# Rebuild backend
cd backend
sudo docker build -t ergonomia-backend:latest .

# Rebuild frontend
cd ../frontend
sudo docker build -t ergonomia-frontend:latest --build-arg VITE_API_URL=/api .

# No Portainer: Stacks → ergonomia → Update the stack
```

## Método B (Docker Hub)

```bash
# No seu computador
cd ergonomia
git pull

# Rebuild e push
docker build -t SEU_USUARIO/ergonomia-backend:latest backend/
docker push SEU_USUARIO/ergonomia-backend:latest

docker build -t SEU_USUARIO/ergonomia-frontend:latest --build-arg VITE_API_URL=/api frontend/
docker push SEU_USUARIO/ergonomia-frontend:latest

# No Portainer: Stacks → ergonomia → Pull and redeploy
```

---

# 🐛 Troubleshooting

## Erro: "image not found"

**Solução:** As imagens não foram construídas.

```bash
# Verificar se as imagens existem
docker images | grep ergonomia

# Se não existir, fazer build
cd /opt/apps/ergonomia
docker build -t ergonomia-backend:latest backend/
docker build -t ergonomia-frontend:latest --build-arg VITE_API_URL=/api frontend/
```

## Erro: "network web not found"

**Solução:** Criar a rede web:

```bash
docker network create web
```

## Containers não iniciam

**Verificar logs:**

```bash
docker logs ergonomia-backend
docker logs ergonomia-frontend
docker logs ergonomia-postgres
```

## Backend não conecta ao banco

**Aguardar 30 segundos.** O postgres leva tempo para inicializar.

Se persistir:

```bash
# Verificar postgres
docker exec ergonomia-postgres pg_isready -U ergonomia_user

# Reiniciar backend
docker restart ergonomia-backend
```

---

# ✅ Checklist de Sucesso

Após deploy, verificar:

- [ ] Todos os 4 containers rodando (frontend, backend, postgres, backup)
- [ ] Site acessível via HTTPS
- [ ] Certificado SSL válido (cadeado verde)
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Senha admin alterada

---

# 📞 Suporte

- **Guia completo:** [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md)
- **Troubleshooting:** [FIX-PORTAINER-DEPLOY.md](FIX-PORTAINER-DEPLOY.md)
- **Issues:** https://github.com/daniellinsr/ergonomia/issues

---

**Bom deploy!** 🎉
