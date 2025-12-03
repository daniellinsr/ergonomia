# Guia de Deploy via Portainer - Sistema de Gestão Ergonômica

Este guia detalha o processo completo para fazer deploy usando Docker e Portainer.

## Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Instalar Docker e Portainer na VPS](#instalar-docker-e-portainer-na-vps)
3. [Configurar DNS no Registro.br](#configurar-dns-no-registrobr)
4. [Preparar arquivos para deploy](#preparar-arquivos-para-deploy)
5. [Deploy via Portainer](#deploy-via-portainer)
6. [Configurar SSL com Traefik](#configurar-ssl-com-traefik-opcional)
7. [Monitoramento e Logs](#monitoramento-e-logs)
8. [Atualização e Rollback](#atualização-e-rollback)

---

## 1. Pré-requisitos

- ✅ VPS da Hostinger com Ubuntu 20.04+ ou Debian 11+
- ✅ Acesso SSH root à VPS
- ✅ Domínio `helthcorp.com.br` no Registro.br
- ✅ Mínimo 2GB RAM (recomendado 4GB)
- ✅ Mínimo 20GB de disco

---

## 2. Instalar Docker e Portainer na VPS

### 2.1 Conectar via SSH

```bash
ssh root@SEU_IP_DA_VPS
```

### 2.2 Instalar Docker

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências
apt install -y ca-certificates curl gnupg lsb-release

# Adicionar chave GPG oficial do Docker
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Adicionar repositório do Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verificar instalação
docker --version
docker compose version
```

### 2.3 Instalar Portainer

```bash
# Criar volume para dados do Portainer
docker volume create portainer_data

# Executar Portainer Community Edition
docker run -d \
  -p 9000:9000 \
  -p 9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest

# Verificar se está rodando
docker ps | grep portainer
```

### 2.4 Acessar Portainer

1. Abra no navegador: `http://SEU_IP_DA_VPS:9000`
2. Na primeira vez, crie uma senha de administrador (mínimo 12 caracteres)
3. Escolha "Docker" como ambiente
4. Clique em "Connect"

**🎉 Portainer instalado com sucesso!**

---

## 3. Configurar DNS no Registro.br

### 3.1 Adicionar registro A

1. Acesse: https://registro.br
2. Faça login
3. Selecione `helthcorp.com.br`
4. Vá em "Editar Zona DNS"
5. Adicione registro **tipo A**:
   - **Nome**: `ergonomia`
   - **Tipo**: `A`
   - **Valor**: `SEU_IP_DA_VPS`
   - **TTL**: `3600`
6. Salve

**Aguarde 15-30 minutos para propagação DNS**

Teste com:
```bash
ping ergonomia.helthcorp.com.br
nslookup ergonomia.helthcorp.com.br
```

---

## 4. Preparar arquivos para deploy

### 4.1 Clonar repositório no servidor

**No servidor VPS:**

```bash
# Instalar Git (se não tiver)
apt install -y git

# Clonar repositório
cd /root
git clone https://github.com/daniellinsr/ergonomia.git
cd ergonomia

# Verificar se os arquivos estão corretos
ls -la
# Deve conter: backend/, frontend/, docker-compose.yml, etc
```

### 4.2 Configurar variáveis de ambiente

**Gerar chaves JWT:**

```bash
# Gerar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Gerar JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Criar arquivo .env:**

```bash
# Copiar template
cp .env.docker.example .env

# Editar com suas credenciais
nano .env
```

**Preencha o arquivo .env:**

```env
DB_NAME=ergonomia_db
DB_USER=ergonomia_user
DB_PASSWORD=SuaSenhaForte123!@#

# Colar as chaves JWT geradas acima
JWT_SECRET=cole_aqui_a_chave_jwt_secret_gerada
JWT_EXPIRES_IN=8h
JWT_REFRESH_SECRET=cole_aqui_a_chave_jwt_refresh_secret_gerada
JWT_REFRESH_EXPIRES_IN=7d

FRONTEND_URL=https://ergonomia.helthcorp.com.br
VITE_API_URL=/api

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
```

Salve o arquivo (Ctrl+O, Enter, Ctrl+X)

---

## 5. Deploy via Portainer

### Método 1: Via Interface Web (Recomendado)

#### 5.1 Fazer upload do projeto

1. No Portainer, vá em **"Stacks"** (menu lateral)
2. Clique em **"+ Add stack"**
3. Dê um nome: `ergonomia`
4. Escolha **"Upload"** ou **"Web editor"**

#### 5.2 Opção A: Upload do docker-compose.yml

1. Selecione **"Upload"**
2. Clique em **"Select file"**
3. Navegue e selecione o arquivo `docker-compose.yml`

#### 5.3 Opção B: Colar conteúdo (Web editor)

1. Selecione **"Web editor"**
2. Cole o conteúdo do `docker-compose.yml`

#### 5.4 Configurar variáveis de ambiente

Na seção **"Environment variables"**:

Clique em **"+ Add an environment variable"** e adicione:

| Nome | Valor |
|------|-------|
| `DB_NAME` | `ergonomia_db` |
| `DB_USER` | `ergonomia_user` |
| `DB_PASSWORD` | `SuaSenhaForte123!` |
| `JWT_SECRET` | `sua_chave_secreta_64_chars` |
| `JWT_REFRESH_SECRET` | `outra_chave_secreta_64_chars` |
| `FRONTEND_URL` | `https://ergonomia.helthcorp.com.br` |
| `VITE_API_URL` | `/api` |

Ou use o arquivo `.env`:
- Clique em **"Load variables from .env file"**
- Faça upload do arquivo `.env`

#### 5.5 Configurar volumes e build

- ✅ Marque **"Enable access control"** (se quiser restringir acesso)
- ✅ **Não** marque "Pull latest image versions" na primeira vez

#### 5.6 Deploy

1. Clique em **"Deploy the stack"**
2. Aguarde o build e inicialização (pode levar 5-10 minutos)

#### 5.7 Acompanhar o progresso

- Vá em **"Containers"**
- Você verá 4 containers sendo criados:
  - `ergonomia-postgres`
  - `ergonomia-backend`
  - `ergonomia-frontend`
  - `ergonomia-backup`

Clique em cada um para ver os logs.

### Método 2: Via CLI (Alternativo)

Se preferir, pode fazer deploy direto via SSH:

```bash
cd /root/ergonomia

# Build e iniciar todos os serviços
docker compose up -d --build

# Ver logs
docker compose logs -f

# Ver status
docker compose ps
```

---

## 6. Executar Migrations do Banco de Dados

### Via Portainer UI

1. Vá em **"Containers"**
2. Clique em `ergonomia-postgres`
3. Clique em **"Console"**
4. Selecione `/bin/sh` e clique em **"Connect"**

No console do PostgreSQL:

```bash
# Verificar se as migrations foram executadas automaticamente
psql -U ergonomia_user -d ergonomia_db -c "\dt"

# Se não tiver tabelas, executar manualmente
psql -U ergonomia_user -d ergonomia_db -f /docker-entrypoint-initdb.d/001_initial_schema.sql
psql -U ergonomia_user -d ergonomia_db -f /docker-entrypoint-initdb.d/002_planos_acao.sql
psql -U ergonomia_user -d ergonomia_db -f /docker-entrypoint-initdb.d/003_remover_trabalhadores.sql
```

### Via CLI

```bash
# Executar migrations via Docker
docker compose exec postgres psql -U ergonomia_user -d ergonomia_db -c "\dt"

# Se necessário, executar manualmente
docker compose exec -T postgres psql -U ergonomia_user -d ergonomia_db < backend/migrations/001_initial_schema.sql
docker compose exec -T postgres psql -U ergonomia_user -d ergonomia_db < backend/migrations/002_planos_acao.sql
docker compose exec -T postgres psql -U ergonomia_user -d ergonomia_db < backend/migrations/003_remover_trabalhadores.sql
```

---

## 7. Configurar Proxy Reverso com SSL

### Opção A: Nginx Proxy Manager (Mais Fácil - Recomendado)

#### 7.1 Instalar Nginx Proxy Manager

Crie uma nova stack no Portainer chamada `nginx-proxy-manager`:

```yaml
version: '3.8'

services:
  nginx-proxy-manager:
    image: 'jc21/nginx-proxy-manager:latest'
    container_name: nginx-proxy-manager
    restart: unless-stopped
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    volumes:
      - nginx-data:/data
      - nginx-letsencrypt:/etc/letsencrypt
    networks:
      - ergonomia_ergonomia-network

volumes:
  nginx-data:
  nginx-letsencrypt:

networks:
  ergonomia_ergonomia-network:
    external: true
```

Deploy esta stack.

#### 7.2 Configurar Nginx Proxy Manager

1. Acesse: `http://SEU_IP_DA_VPS:81`
2. Login padrão:
   - Email: `admin@example.com`
   - Senha: `changeme`
3. **Altere imediatamente** email e senha!

#### 7.3 Adicionar Proxy Host

1. Vá em **"Hosts" → "Proxy Hosts"**
2. Clique em **"Add Proxy Host"**
3. Preencha:
   - **Domain Names**: `ergonomia.helthcorp.com.br`
   - **Scheme**: `http`
   - **Forward Hostname / IP**: `ergonomia-frontend`
   - **Forward Port**: `80`
   - ✅ Marque "Block Common Exploits"
   - ✅ Marque "Websockets Support"

4. Vá na aba **"SSL"**:
   - ✅ Marque "Request a new SSL Certificate"
   - ✅ Marque "Force SSL"
   - ✅ Marque "HTTP/2 Support"
   - Digite seu email
   - ✅ Aceite os termos do Let's Encrypt

5. Clique em **"Save"**

**Pronto! SSL configurado automaticamente!** 🎉

### Opção B: Traefik (Mais Avançado)

Se preferir usar Traefik, veja o arquivo `docker-compose.traefik.yml` (criar se necessário).

---

## 8. Verificar Deploy

### 8.1 Testar aplicação

1. Abra no navegador: `https://ergonomia.helthcorp.com.br`
2. Deve carregar a tela de login
3. Teste a API: `https://ergonomia.helthcorp.com.br/api/health`

### 8.2 Verificar containers no Portainer

1. Vá em **"Containers"**
2. Todos devem estar com status **"running"** e sinal verde ✓

### 8.3 Ver logs

No Portainer:
1. Clique no container
2. Clique em **"Logs"**
3. Veja os logs em tempo real

---

## 9. Monitoramento e Logs

### 9.1 Via Portainer UI

**Ver status de containers:**
- Menu **"Containers"**

**Ver logs:**
1. Clique no container
2. **"Logs"** tab
3. Escolha número de linhas
4. ✅ Marque "Auto-refresh logs"

**Ver uso de recursos:**
1. Clique no container
2. **"Stats"** tab
3. Veja CPU, memória, rede em tempo real

**Ver volumes:**
- Menu **"Volumes"**
- `postgres-data` (dados do banco)
- `postgres-backups` (backups automáticos)

### 9.2 Via CLI

```bash
# Ver status
docker compose ps

# Logs de todos os serviços
docker compose logs -f

# Logs de um serviço específico
docker compose logs -f backend

# Stats de uso de recursos
docker stats

# Ver volumes
docker volume ls
```

---

## 10. Atualização da Aplicação

### 10.1 Via Portainer UI

1. Vá em **"Stacks"**
2. Clique na stack `ergonomia`
3. Clique em **"Editor"**
4. Faça as alterações necessárias
5. Clique em **"Update the stack"**
6. ✅ Marque **"Re-pull image and redeploy"**
7. Clique em **"Update"**

### 10.2 Atualizar código (via Git)

```bash
# No servidor
cd /root/ergonomia
git pull

# Rebuild e restart
docker compose up -d --build

# Ou via Portainer: Stack → ergonomia → Update stack
```

### 10.3 Rollback (reverter para versão anterior)

Via Portainer:
1. **"Stacks"** → `ergonomia`
2. Veja o histórico de versões
3. Clique em uma versão anterior
4. **"Deploy this version"**

Via CLI:
```bash
# Parar containers
docker compose down

# Voltar código para commit anterior (Git)
git checkout HASH_DO_COMMIT_ANTERIOR

# Rebuild e restart
docker compose up -d --build
```

---

## 11. Backup e Restore

### 11.1 Backup automático

O container `postgres-backup` faz backup automático diário.

**Ver backups:**

Via Portainer:
1. **"Volumes"** → `postgres-backups`
2. **"Browse volume"**

Via CLI:
```bash
# Listar backups
docker compose exec postgres-backup ls -lh /backups

# Copiar backup para sua máquina
docker cp ergonomia-backup:/backups/daily/ergonomia_db-YYYY-MM-DD.sql.gz ./backup.sql.gz
```

### 11.2 Backup manual

```bash
# Fazer backup
docker compose exec postgres pg_dump -U ergonomia_user ergonomia_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Download do backup (no Windows PowerShell)
scp root@SEU_IP_DA_VPS:/root/ergonomia/backup_*.sql.gz C:\Users\daniel.rodriguez\Downloads\
```

### 11.3 Restore de backup

```bash
# Upload do backup (Windows PowerShell)
scp C:\caminho\do\backup.sql.gz root@SEU_IP_DA_VPS:/root/

# No servidor, restaurar
cd /root
gunzip backup.sql.gz
docker compose exec -T postgres psql -U ergonomia_user -d ergonomia_db < backup.sql
```

---

## 12. Solução de Problemas

### Problema: Container não inicia

**No Portainer:**
1. **"Containers"** → Clique no container
2. Veja **"Logs"** para erros
3. Veja **"Inspect"** para configuração

**Soluções comuns:**
- Verificar variáveis de ambiente
- Verificar se portas não estão em uso: `docker ps`
- Recriar container: **"Recreate"**

### Problema: Erro de banco de dados

```bash
# Verificar se PostgreSQL está rodando
docker compose ps postgres

# Ver logs do PostgreSQL
docker compose logs postgres

# Testar conexão
docker compose exec postgres psql -U ergonomia_user -d ergonomia_db -c "SELECT 1"
```

### Problema: Frontend não carrega

```bash
# Ver logs do Nginx
docker compose logs frontend

# Verificar se backend está acessível
docker compose exec frontend wget -O- http://backend:3001/api/health
```

### Problema: SSL não funciona

**No Nginx Proxy Manager:**
1. **"SSL Certificates"**
2. Verificar validade do certificado
3. Se expirado, clicar em **"Renew"**

**Verificar DNS:**
```bash
nslookup ergonomia.helthcorp.com.br
```

### Limpar tudo e recomeçar

```bash
# CUIDADO: Apaga TUDO incluindo dados!
docker compose down -v
docker system prune -af --volumes

# Recomeçar do zero
docker compose up -d --build
```

---

## 13. Comandos Úteis do Portainer

### Via Interface Web

- **Dashboard**: Visão geral do sistema
- **Containers**: Gerenciar containers
- **Images**: Ver imagens Docker
- **Networks**: Gerenciar redes
- **Volumes**: Gerenciar volumes persistentes
- **Stacks**: Gerenciar aplicações multi-container
- **Events**: Ver eventos do sistema
- **Settings**: Configurações do Portainer

### Via CLI (Docker Compose)

```bash
# Iniciar todos os serviços
docker compose up -d

# Parar todos os serviços
docker compose down

# Rebuild e reiniciar
docker compose up -d --build

# Ver logs
docker compose logs -f [service_name]

# Escalar serviço
docker compose up -d --scale backend=3

# Ver uso de recursos
docker stats

# Executar comando em container
docker compose exec backend sh
docker compose exec postgres psql -U ergonomia_user -d ergonomia_db
```

---

## 14. Checklist Final

Antes de considerar o deploy completo:

- [ ] DNS aponta para VPS (`nslookup ergonomia.helthcorp.com.br`)
- [ ] Docker instalado (`docker --version`)
- [ ] Portainer acessível (`http://IP:9000`)
- [ ] Stack `ergonomia` criada no Portainer
- [ ] Todos os 4 containers rodando (postgres, backend, frontend, backup)
- [ ] Migrations executadas (banco com tabelas criadas)
- [ ] Nginx Proxy Manager configurado
- [ ] SSL configurado e funcionando
- [ ] Site acessível via HTTPS (`https://ergonomia.helthcorp.com.br`)
- [ ] Login funcionando
- [ ] API respondendo (`https://ergonomia.helthcorp.com.br/api/health`)
- [ ] Backup automático configurado
- [ ] Senha do Portainer alterada
- [ ] Senha do Nginx Proxy Manager alterada

---

## 15. Segurança Adicional

### 15.1 Firewall (UFW)

```bash
# Instalar UFW
apt install -y ufw

# Configurar regras
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 9000/tcp  # Portainer (remover depois de configurar)

# Ativar firewall
ufw enable

# Ver status
ufw status
```

### 15.2 Fail2Ban (proteção contra ataques)

```bash
# Instalar
apt install -y fail2ban

# Configurar
systemctl enable fail2ban
systemctl start fail2ban
```

### 15.3 Atualizar senhas padrão

- ✅ Senha do usuário root da VPS
- ✅ Senha do PostgreSQL
- ✅ Senha do Portainer
- ✅ Senha do Nginx Proxy Manager
- ✅ JWT secrets

---

## 16. Contatos e Suporte

- **Portainer**: https://www.portainer.io/documentation
- **Docker**: https://docs.docker.com/
- **Nginx Proxy Manager**: https://nginxproxymanager.com/guide/
- **Hostinger**: https://www.hostinger.com.br/suporte
- **Registro.br**: https://registro.br/suporte/

---

**🎉 Deploy via Portainer finalizado!**

Sua aplicação está rodando em containers Docker gerenciados pelo Portainer em:
- **URL**: `https://ergonomia.helthcorp.com.br`
- **Portainer**: `http://SEU_IP:9000` (ou `https://SEU_IP:9443`)
- **Nginx Proxy Manager**: `http://SEU_IP:81`
