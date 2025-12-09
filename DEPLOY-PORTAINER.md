# Deploy via Portainer - Sistema de Ergonomia

Este guia mostra como fazer deploy do sistema de ergonomia usando o Portainer em um servidor que já tem Traefik configurado.

## Pré-requisitos

✅ Servidor com Docker instalado
✅ Traefik rodando com rede externa `web`
✅ Portainer instalado e acessível
✅ Domínio apontando para o servidor (ex: `ergonomia.helthcorp.com.br`)

## Passo 1: Preparar o Repositório no Servidor

### 1.1 Conectar ao servidor via SSH

```bash
ssh usuario@seu-servidor.com.br
```

### 1.2 Clonar o repositório

```bash
# Criar diretório para aplicações (se não existir)
sudo mkdir -p /opt/apps
cd /opt/apps

# Clonar repositório
sudo git clone https://github.com/daniellinsr/ergonomia.git
cd ergonomia
```

### 1.3 Configurar variáveis de ambiente

```bash
# Copiar arquivo de exemplo
sudo cp .env.docker.example .env

# Editar arquivo .env
sudo nano .env
```

**Preencha as seguintes variáveis:**

```env
# Database
DB_PASSWORD=SuaSenhaForteDoBancoDeDados123!

# JWT Secrets (gerar com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=sua_chave_secreta_64_caracteres_aqui
JWT_REFRESH_SECRET=outra_chave_secreta_64_caracteres_aqui

# Traefik
TRAEFIK_HOST=ergonomia.helthcorp.com.br

# Frontend
FRONTEND_URL=https://ergonomia.helthcorp.com.br
```

**Salvar:** `Ctrl + O`, `Enter`, `Ctrl + X`

## Passo 2: Deploy via Portainer

### 2.1 Acessar Portainer

Acesse: `https://portainer.helthcorp.com.br`

### 2.2 Criar Stack

1. No menu lateral, clique em **Stacks**
2. Clique em **+ Add stack**
3. Preencha:
   - **Name:** `ergonomia`
   - **Build method:** Selecione **Repository**

### 2.3 Configurar Repositório Git

- **Repository URL:** `https://github.com/daniellinsr/ergonomia.git`
- **Repository reference:** `refs/heads/main` (ou `master`)
- **Compose path:** `docker-compose.yml`

### 2.4 Configurar Variáveis de Ambiente

Na seção **Environment variables**, clique em **+ add environment variable** e adicione:

| Nome | Valor |
|------|-------|
| `DB_NAME` | `ergonomia_db` |
| `DB_USER` | `ergonomia_user` |
| `DB_PASSWORD` | Sua senha forte |
| `JWT_SECRET` | Sua chave JWT (64 caracteres) |
| `JWT_EXPIRES_IN` | `8h` |
| `JWT_REFRESH_SECRET` | Sua chave refresh (64 caracteres) |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `TRAEFIK_HOST` | `ergonomia.helthcorp.com.br` |
| `FRONTEND_URL` | `https://ergonomia.helthcorp.com.br` |
| `VITE_API_URL` | `/api` |
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | `200` |

### 2.5 Opções Avançadas

Em **Advanced mode**, ative:
- ✅ **Enable access control**
- ✅ **Auto update** (opcional)

### 2.6 Deploy da Stack

1. Clique em **Deploy the stack**
2. Aguarde o build e inicialização dos containers
3. Monitore os logs na aba **Containers**

## Passo 3: Executar Migrations do Banco

Após os containers estarem rodando:

### Via Portainer (Interface Web)

1. Vá em **Containers**
2. Clique no container `ergonomia-postgres`
3. Clique em **Console**
4. Clique em **Connect**
5. Execute:

```bash
psql -U ergonomia_user -d ergonomia_db < /docker-entrypoint-initdb.d/001_initial_schema.sql
```

### Via SSH no servidor

```bash
cd /opt/apps/ergonomia

docker exec -i ergonomia-postgres psql -U ergonomia_user -d ergonomia_db < backend/migrations/001_initial_schema.sql
```

## Passo 4: Verificar Deploy

### 4.1 Verificar Containers

No Portainer, em **Containers**, verifique se todos estão **running**:

- ✅ `ergonomia-frontend` (verde/healthy)
- ✅ `ergonomia-backend` (verde/healthy)
- ✅ `ergonomia-postgres` (verde/healthy)
- ✅ `ergonomia-backup` (verde/running)

### 4.2 Verificar Traefik

1. Acesse os logs do Traefik:
   ```bash
   docker logs traefik --tail 50
   ```

2. Deve aparecer algo como:
   ```
   Router ergonomia@docker registered
   Certificate obtained for ergonomia.helthcorp.com.br
   ```

### 4.3 Acessar Aplicação

Acesse: **https://ergonomia.helthcorp.com.br**

### 4.4 Login Inicial

**Usuário padrão:**
- Email: `admin@sistema.com`
- Senha: `admin123`

⚠️ **IMPORTANTE:** Altere a senha do admin imediatamente após o primeiro acesso!

## Passo 5: Criar Usuário Admin Real

1. Faça login com o usuário padrão
2. Vá em **Usuários**
3. Crie seu usuário admin com seus dados
4. Faça logout
5. Faça login com o novo usuário
6. Delete ou desabilite o usuário padrão

## Atualização da Aplicação

### Via Portainer

1. Vá em **Stacks**
2. Clique em `ergonomia`
3. Clique em **Pull and redeploy**
4. Confirme a ação

### Via SSH

```bash
cd /opt/apps/ergonomia
sudo git pull
docker compose up -d --build
```

## Backup e Restore

### Backup Automático

O container `ergonomia-backup` faz backup diário automático:
- **Horário:** Diariamente à meia-noite
- **Retenção:** 7 dias, 4 semanas, 6 meses
- **Local:** Volume `postgres-backups`

### Backup Manual

```bash
docker exec ergonomia-postgres pg_dump -U ergonomia_user -d ergonomia_db > backup-$(date +%Y%m%d).sql
```

### Restore

```bash
docker exec -i ergonomia-postgres psql -U ergonomia_user -d ergonomia_db < backup-20250101.sql
```

## Monitoramento

### Ver Logs em Tempo Real

**Via Portainer:**
1. Vá em **Containers**
2. Clique no container desejado
3. Clique em **Logs**
4. Ative **Auto-refresh**

**Via SSH:**
```bash
# Backend
docker logs -f ergonomia-backend

# Frontend
docker logs -f ergonomia-frontend

# Postgres
docker logs -f ergonomia-postgres

# Todos
docker compose logs -f
```

### Verificar Status

```bash
docker compose ps
```

### Verificar Recursos

```bash
docker stats
```

## Troubleshooting

### Problema: Container não inicia

```bash
# Ver logs do container
docker logs ergonomia-frontend
docker logs ergonomia-backend

# Verificar configuração
docker compose config
```

### Problema: Erro de conexão com banco

```bash
# Verificar se o postgres está rodando
docker exec ergonomia-postgres pg_isready -U ergonomia_user

# Verificar logs do postgres
docker logs ergonomia-postgres
```

### Problema: Traefik não roteia

```bash
# Verificar se o container está na rede web
docker inspect ergonomia-frontend | grep -A 10 Networks

# Verificar labels do Traefik
docker inspect ergonomia-frontend | grep -A 20 Labels

# Ver logs do Traefik
docker logs traefik --tail 100
```

### Problema: SSL não funciona

1. Verificar se o domínio aponta para o servidor:
   ```bash
   nslookup ergonomia.helthcorp.com.br
   ```

2. Verificar se as portas 80 e 443 estão abertas:
   ```bash
   sudo netstat -tulpn | grep -E ':(80|443)'
   ```

3. Verificar certificado no Traefik:
   ```bash
   docker exec traefik cat /acme.json
   ```

## Estrutura de Diretórios no Servidor

```
/opt/apps/ergonomia/
├── backend/
│   ├── src/
│   ├── migrations/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   └── Dockerfile
├── docker-compose.yml
├── .env                    # Suas variáveis (NÃO commitado)
└── .env.docker.example     # Template
```

## Volumes Docker

```bash
# Listar volumes
docker volume ls | grep ergonomia

# Inspecionar volume
docker volume inspect ergonomia_postgres-data

# Backup de volume
docker run --rm -v ergonomia_postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-data.tar.gz -C /data .

# Restore de volume
docker run --rm -v ergonomia_postgres-data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-data.tar.gz -C /data
```

## Segurança

### Firewall

```bash
# Permitir apenas portas necessárias
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Atualizar Sistema

```bash
# Atualizar sistema operacional
sudo apt update && sudo apt upgrade -y

# Atualizar Docker
sudo apt install docker-ce docker-ce-cli containerd.io
```

### Rotação de Senhas

1. Alterar senha do banco:
   ```bash
   docker exec -it ergonomia-postgres psql -U postgres
   ALTER USER ergonomia_user WITH PASSWORD 'nova_senha_forte';
   ```

2. Atualizar `.env` com a nova senha

3. Reiniciar containers:
   ```bash
   docker compose restart backend
   ```

## Suporte

- **Documentação completa:** [README.md](README.md)
- **Issues:** https://github.com/daniellinsr/ergonomia/issues
- **Email:** suporte@helthcorp.com.br

---

**Deploy realizado com sucesso?** 🎉
Acesse: https://ergonomia.helthcorp.com.br
