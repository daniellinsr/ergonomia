# Guia Rápido de Deploy para Produção

Este é um guia resumido para colocar rapidamente o sistema em produção.

## Passo 1: Configurar DNS no Registro.br

1. Acesse https://registro.br
2. Faça login
3. Selecione o domínio `helthcorp.com.br`
4. Vá em "Editar Zona" ou "DNS"
5. Adicione um registro **tipo A**:
   - Nome: `ergonomia`
   - Tipo: `A`
   - Valor: `IP_DA_SUA_VPS_HOSTINGER`
   - TTL: `3600`
6. Salve

**Aguarde 15-30 minutos para propagação**

Teste com: `ping ergonomia.helthcorp.com.br`

---

## Passo 2: Preparar o Servidor VPS

Conecte via SSH:

```bash
ssh root@IP_DA_VPS
```

Execute o script de setup (copie e cole no terminal):

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# Instalar Nginx
apt install -y nginx

# Instalar PM2
npm install -g pm2

# Instalar Certbot (SSL)
apt install -y certbot python3-certbot-nginx

# Instalar Git
apt install -y git

# Criar usuário deploy
adduser deploy
usermod -aG sudo deploy
```

---

## Passo 3: Configurar PostgreSQL

```bash
# Entrar no PostgreSQL
sudo -u postgres psql

# Executar no console do PostgreSQL:
CREATE DATABASE ergonomia_db;
CREATE USER ergonomia_user WITH ENCRYPTED PASSWORD 'SuaSenhaForte123!';
GRANT ALL PRIVILEGES ON DATABASE ergonomia_db TO ergonomia_user;
\q
```

---

## Passo 4: Enviar Código para o Servidor

### Opção A: Via SCP (do Windows)

No PowerShell do Windows:

```powershell
# Backend
scp -r C:\Users\daniel.rodriguez\Documents\pessoal\code\ergonomia\backend deploy@IP_DA_VPS:/var/www/ergonomia/

# Frontend (depois do build)
cd C:\Users\daniel.rodriguez\Documents\pessoal\code\ergonomia\frontend
npm run build
scp -r .\dist deploy@IP_DA_VPS:/var/www/ergonomia/frontend/
```

### Opção B: Via Git

```bash
# No servidor
sudo mkdir -p /var/www/ergonomia
sudo chown -R deploy:deploy /var/www/ergonomia
cd /var/www/ergonomia
git clone SEU_REPOSITORIO backend
```

---

## Passo 5: Configurar Backend

No servidor:

```bash
cd /var/www/ergonomia/backend

# Criar .env
nano .env
```

Cole (ajustando valores):

```env
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ergonomia_db
DB_USER=ergonomia_user
DB_PASSWORD=SuaSenhaForte123!
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_EXPIRES_IN=8h
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://ergonomia.helthcorp.com.br
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
```

Salve (Ctrl+O, Enter, Ctrl+X)

```bash
# Instalar dependências
npm install --production

# Executar migrations
PGPASSWORD='SuaSenhaForte123!' psql -h localhost -U ergonomia_user -d ergonomia_db -f migrations/001_initial_schema.sql
PGPASSWORD='SuaSenhaForte123!' psql -h localhost -U ergonomia_user -d ergonomia_db -f migrations/002_planos_acao.sql
PGPASSWORD='SuaSenhaForte123!' psql -h localhost -U ergonomia_user -d ergonomia_db -f migrations/003_remover_trabalhadores.sql

# Iniciar com PM2
pm2 start src/server.js --name ergonomia-backend
pm2 save
pm2 startup
```

---

## Passo 6: Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/ergonomia
```

Cole:

```nginx
server {
    listen 80;
    server_name ergonomia.helthcorp.com.br;

    client_max_body_size 10M;

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
    }

    location / {
        root /var/www/ergonomia/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

Salve e ative:

```bash
sudo ln -s /etc/nginx/sites-available/ergonomia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Passo 7: Configurar SSL (HTTPS)

```bash
sudo certbot --nginx -d ergonomia.helthcorp.com.br
```

Siga as instruções:
1. Digite seu email
2. Aceite os termos
3. Escolha opção 2 (Redirect HTTP para HTTPS)

Pronto! Certificado válido por 90 dias com renovação automática.

---

## Passo 8: Testar

Abra no navegador: `https://ergonomia.helthcorp.com.br`

---

## Comandos Úteis

```bash
# Ver status do backend
pm2 status

# Ver logs do backend
pm2 logs ergonomia-backend

# Reiniciar backend
pm2 restart ergonomia-backend

# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Testar configuração do Nginx
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx

# Status do PostgreSQL
sudo systemctl status postgresql

# Renovar SSL manualmente
sudo certbot renew
```

---

## Solução de Problemas

### Site não abre
```bash
sudo systemctl status nginx
sudo nginx -t
```

### API não responde
```bash
pm2 logs ergonomia-backend
pm2 restart ergonomia-backend
```

### Erro de banco
```bash
sudo systemctl status postgresql
psql -h localhost -U ergonomia_user -d ergonomia_db
```

---

## Atualização do Sistema

### Atualizar Backend
```bash
cd /var/www/ergonomia/backend
git pull  # ou envie via SCP
npm install --production
pm2 restart ergonomia-backend
```

### Atualizar Frontend
```bash
# No Windows: fazer build
npm run build

# Enviar para servidor
scp -r .\dist\* deploy@IP_DA_VPS:/var/www/ergonomia/frontend/

# No servidor
sudo systemctl reload nginx
```

---

**Pronto! Sistema em produção! 🚀**
