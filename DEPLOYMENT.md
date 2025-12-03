# Guia de Deployment - Sistema de Gestão Ergonômica

Este guia detalha o processo completo para colocar o sistema em produção em uma VPS da Hostinger.

## Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Servidor VPS](#configuração-do-servidor-vps)
3. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
4. [Configuração do DNS no Registro.br](#configuração-do-dns-no-registrobr)
5. [Deploy do Backend](#deploy-do-backend)
6. [Deploy do Frontend](#deploy-do-frontend)
7. [Configuração do Nginx](#configuração-do-nginx)
8. [Configuração SSL com Let's Encrypt](#configuração-ssl-com-lets-encrypt)
9. [Monitoramento e Logs](#monitoramento-e-logs)

---

## Pré-requisitos

Antes de começar, você precisa ter:

- ✅ Acesso SSH à VPS da Hostinger
- ✅ Domínio `helthcorp.com.br` registrado no Registro.br
- ✅ Acesso ao painel do Registro.br para configurar DNS
- ✅ Código-fonte do projeto (backend e frontend)

---

## 1. Configuração do Servidor VPS

### 1.1 Conectar via SSH

```bash
ssh root@SEU_IP_DA_VPS
```

### 1.2 Atualizar o sistema

```bash
apt update && apt upgrade -y
```

### 1.3 Instalar dependências básicas

```bash
# Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# PostgreSQL 15
apt install -y postgresql postgresql-contrib

# Nginx
apt install -y nginx

# PM2 (gerenciador de processos Node.js)
npm install -g pm2

# Git
apt install -y git

# Certbot (para SSL)
apt install -y certbot python3-certbot-nginx

# Ferramentas úteis
apt install -y curl wget unzip htop
```

### 1.4 Criar usuário de deploy (mais seguro que usar root)

```bash
# Criar usuário
adduser deploy
usermod -aG sudo deploy

# Configurar SSH para o usuário deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

**A partir daqui, use o usuário deploy:**

```bash
# Sair e reconectar como deploy
exit
ssh deploy@SEU_IP_DA_VPS
```

---

## 2. Configuração do Banco de Dados

### 2.1 Configurar PostgreSQL

```bash
# Mudar para usuário postgres
sudo -u postgres psql

# No console do PostgreSQL, execute:
```

```sql
-- Criar banco de dados
CREATE DATABASE ergonomia_db;

-- Criar usuário
CREATE USER ergonomia_user WITH ENCRYPTED PASSWORD 'SUA_SENHA_FORTE_AQUI';

-- Conceder privilégios
GRANT ALL PRIVILEGES ON DATABASE ergonomia_db TO ergonomia_user;

-- Sair
\q
```

### 2.2 Configurar acesso remoto (se necessário)

Edite o arquivo de configuração do PostgreSQL:

```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
```

Altere a linha:
```
listen_addresses = 'localhost'  # apenas local (recomendado)
# OU
listen_addresses = '*'  # permite acesso remoto (menos seguro)
```

Edite também:
```bash
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

Adicione ao final:
```
# Permitir conexões do localhost
host    ergonomia_db    ergonomia_user    127.0.0.1/32    md5
```

Reinicie o PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### 2.3 Executar migrations

```bash
# Será feito depois que o código estiver no servidor
```

---

## 3. Configuração do DNS no Registro.br

### 3.1 Acessar o painel do Registro.br

1. Acesse: https://registro.br
2. Faça login com seu CPF/CNPJ
3. Selecione o domínio `helthcorp.com.br`
4. Clique em "Alterar Servidores DNS"

### 3.2 Configurar DNS (duas opções)

#### Opção A: Usar DNS do Registro.br (mais simples)

Se você usa os DNS do próprio Registro.br:

1. Vá em "Editar Zona"
2. Adicione um registro do tipo **A**:
   - **Nome**: `ergonomia`
   - **Tipo**: `A`
   - **Valor**: `SEU_IP_DA_VPS`
   - **TTL**: `3600` (1 hora)
3. Salve as alterações

#### Opção B: Usar DNS da Hostinger

Se você usa os DNS da Hostinger:

1. No painel da Hostinger, vá em "DNS/Nameservers"
2. Adicione um registro do tipo **A**:
   - **Nome**: `ergonomia`
   - **Aponta para**: `SEU_IP_DA_VPS`
   - **TTL**: `3600`
3. Salve

### 3.3 Verificar propagação DNS

Aguarde de 5 minutos a 48 horas (geralmente 15-30 minutos). Verifique com:

```bash
# No seu computador local
nslookup ergonomia.helthcorp.com.br

# OU
ping ergonomia.helthcorp.com.br
```

---

## 4. Deploy do Backend

### 4.1 Criar estrutura de diretórios

```bash
sudo mkdir -p /var/www/ergonomia
sudo chown -R deploy:deploy /var/www/ergonomia
cd /var/www/ergonomia
```

### 4.2 Clonar ou enviar código

**Opção A: Via Git (recomendado)**

```bash
# Se você tem um repositório Git
git clone SEU_REPOSITORIO_GIT backend
cd backend
```

**Opção B: Via SCP do seu computador local**

```bash
# No seu computador Windows (PowerShell)
scp -r C:\Users\daniel.rodriguez\Documents\pessoal\code\ergonomia\backend deploy@SEU_IP_DA_VPS:/var/www/ergonomia/
```

### 4.3 Configurar variáveis de ambiente

```bash
cd /var/www/ergonomia/backend
nano .env
```

Conteúdo do `.env` de produção:

```env
NODE_ENV=production
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ergonomia_db
DB_USER=ergonomia_user
DB_PASSWORD=SUA_SENHA_FORTE_AQUI

# JWT
JWT_SECRET=gere_uma_chave_secreta_muito_forte_aqui_64_caracteres
JWT_EXPIRES_IN=8h
JWT_REFRESH_SECRET=outra_chave_secreta_diferente_64_caracteres
JWT_REFRESH_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://ergonomia.helthcorp.com.br

# Rate Limit
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
```

**Para gerar chaves secretas seguras:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4.4 Instalar dependências e executar migrations

```bash
cd /var/www/ergonomia/backend

# Instalar dependências (somente produção)
npm install --production

# Executar migrations
PGPASSWORD=SUA_SENHA_FORTE_AQUI psql -h localhost -U ergonomia_user -d ergonomia_db -f migrations/001_initial_schema.sql
PGPASSWORD=SUA_SENHA_FORTE_AQUI psql -h localhost -U ergonomia_user -d ergonomia_db -f migrations/002_planos_acao.sql
PGPASSWORD=SUA_SENHA_FORTE_AQUI psql -h localhost -U ergonomia_user -d ergonomia_db -f migrations/003_remover_trabalhadores.sql
```

### 4.5 Iniciar backend com PM2

```bash
cd /var/www/ergonomia/backend

# Iniciar aplicação
pm2 start src/server.js --name ergonomia-backend -i max

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
# Execute o comando que o PM2 mostrar
```

### 4.6 Verificar se está rodando

```bash
pm2 status
pm2 logs ergonomia-backend
curl http://localhost:3001/api/health
```

---

## 5. Deploy do Frontend

### 5.1 Preparar build local (no seu Windows)

```bash
# No seu computador, na pasta do frontend
cd C:\Users\daniel.rodriguez\Documents\pessoal\code\ergonomia\frontend

# Criar arquivo .env.production
echo VITE_API_URL=https://ergonomia.helthcorp.com.br/api > .env.production

# Instalar dependências e fazer build
npm install
npm run build
```

Isso criará uma pasta `dist` com os arquivos estáticos.

### 5.2 Enviar build para o servidor

```bash
# No PowerShell do Windows
scp -r .\dist\* deploy@SEU_IP_DA_VPS:/var/www/ergonomia/frontend/
```

**OU direto no servidor:**

```bash
# No servidor VPS
cd /var/www/ergonomia
mkdir -p frontend

# Copiar arquivos do build
# (você enviará via SCP do Windows)
```

---

## 6. Configuração do Nginx

### 6.1 Criar configuração do site

```bash
sudo nano /etc/nginx/sites-available/ergonomia
```

Conteúdo inicial (HTTP apenas - SSL será configurado depois):

```nginx
# Redirecionar www para não-www
server {
    listen 80;
    server_name www.ergonomia.helthcorp.com.br;
    return 301 http://ergonomia.helthcorp.com.br$request_uri;
}

# Servidor principal
server {
    listen 80;
    server_name ergonomia.helthcorp.com.br;

    # Logs
    access_log /var/log/nginx/ergonomia-access.log;
    error_log /var/log/nginx/ergonomia-error.log;

    # Segurança
    client_max_body_size 10M;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend (SPA React)
    location / {
        root /var/www/ergonomia/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;

        # Cache de assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Desabilitar cache do index.html
    location = /index.html {
        root /var/www/ergonomia/frontend;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
}
```

### 6.2 Ativar o site

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/ergonomia /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### 6.3 Testar acesso

Abra no navegador: `http://ergonomia.helthcorp.com.br`

---

## 7. Configuração SSL com Let's Encrypt

### 7.1 Obter certificado SSL

```bash
sudo certbot --nginx -d ergonomia.helthcorp.com.br -d www.ergonomia.helthcorp.com.br
```

Siga as instruções:
1. Digite seu email
2. Aceite os termos
3. Escolha se quer compartilhar email (opcional)
4. Escolha opção 2: "Redirect" (redirecionar HTTP para HTTPS)

### 7.2 Verificar renovação automática

```bash
# Testar renovação
sudo certbot renew --dry-run

# Verificar timer de renovação automática
sudo systemctl status certbot.timer
```

O Certbot configura automaticamente a renovação. O certificado é válido por 90 dias e renova automaticamente.

### 7.3 Configuração final do Nginx (após SSL)

O Certbot já terá modificado automaticamente o arquivo `/etc/nginx/sites-available/ergonomia`. Verifique:

```bash
sudo nano /etc/nginx/sites-available/ergonomia
```

Deve ter algo como:

```nginx
server {
    server_name ergonomia.helthcorp.com.br www.ergonomia.helthcorp.com.br;

    # ... resto da configuração ...

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/ergonomia.helthcorp.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ergonomia.helthcorp.com.br/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = ergonomia.helthcorp.com.br) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name ergonomia.helthcorp.com.br www.ergonomia.helthcorp.com.br;
    return 404;
}
```

---

## 8. Monitoramento e Logs

### 8.1 Comandos úteis do PM2

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs ergonomia-backend

# Reiniciar aplicação
pm2 restart ergonomia-backend

# Parar aplicação
pm2 stop ergonomia-backend

# Monitoramento
pm2 monit
```

### 8.2 Logs do Nginx

```bash
# Logs de acesso
sudo tail -f /var/log/nginx/ergonomia-access.log

# Logs de erro
sudo tail -f /var/log/nginx/ergonomia-error.log
```

### 8.3 Logs do PostgreSQL

```bash
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

---

## 9. Checklist Final

Antes de considerar o deploy completo, verifique:

- [ ] DNS aponta para o IP correto (`nslookup ergonomia.helthcorp.com.br`)
- [ ] Backend rodando (`pm2 status`)
- [ ] PostgreSQL rodando (`sudo systemctl status postgresql`)
- [ ] Nginx rodando (`sudo systemctl status nginx`)
- [ ] Site acessível via HTTP (`http://ergonomia.helthcorp.com.br`)
- [ ] SSL configurado e funcionando (`https://ergonomia.helthcorp.com.br`)
- [ ] Redirecionamento HTTP → HTTPS funcionando
- [ ] Login funcionando
- [ ] API respondendo corretamente
- [ ] PM2 configurado para iniciar no boot
- [ ] Certificado SSL com renovação automática configurada
- [ ] Logs sendo gerados corretamente
- [ ] Backup do banco de dados configurado (ver próxima seção)

---

## 10. Backup do Banco de Dados

### 10.1 Criar script de backup

```bash
sudo nano /usr/local/bin/backup-ergonomia.sh
```

Conteúdo:

```bash
#!/bin/bash
# Script de backup do banco de dados Ergonomia

BACKUP_DIR="/var/backups/ergonomia"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ergonomia_db_$DATE.sql.gz"

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Fazer backup
PGPASSWORD='SUA_SENHA_FORTE_AQUI' pg_dump -h localhost -U ergonomia_user ergonomia_db | gzip > $BACKUP_FILE

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "ergonomia_db_*.sql.gz" -mtime +7 -delete

echo "Backup criado: $BACKUP_FILE"
```

Tornar executável:

```bash
sudo chmod +x /usr/local/bin/backup-ergonomia.sh
```

### 10.2 Agendar backup diário (cron)

```bash
sudo crontab -e
```

Adicione:

```cron
# Backup diário às 2h da manhã
0 2 * * * /usr/local/bin/backup-ergonomia.sh >> /var/log/backup-ergonomia.log 2>&1
```

---

## 11. Atualização do Sistema

### 11.1 Atualizar backend

```bash
cd /var/www/ergonomia/backend
git pull  # se usando Git
npm install --production
pm2 restart ergonomia-backend
```

### 11.2 Atualizar frontend

```bash
# No seu Windows, fazer novo build
npm run build

# Enviar para servidor
scp -r .\dist\* deploy@SEU_IP_DA_VPS:/var/www/ergonomia/frontend/

# No servidor
sudo systemctl reload nginx
```

---

## 12. Troubleshooting

### Problema: Site não carrega

```bash
# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx

# Verificar logs
sudo tail -f /var/log/nginx/ergonomia-error.log
```

### Problema: API não responde

```bash
# Verificar PM2
pm2 status
pm2 logs ergonomia-backend --lines 100

# Verificar se porta está ouvindo
sudo netstat -tulpn | grep 3001
```

### Problema: Erro de banco de dados

```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Testar conexão
psql -h localhost -U ergonomia_user -d ergonomia_db
```

### Problema: SSL não funciona

```bash
# Verificar certificado
sudo certbot certificates

# Renovar manualmente
sudo certbot renew --force-renewal
```

---

## Contatos e Suporte

- **Hostinger Support**: https://www.hostinger.com.br/suporte
- **Registro.br**: https://registro.br/suporte/

---

**Deployment finalizado! 🚀**

Seu sistema está agora em produção em `https://ergonomia.helthcorp.com.br`
