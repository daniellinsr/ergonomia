# Guia de Deploy com Traefik - Sistema de Gestão Ergonômica

Deploy profissional usando Docker + Traefik com SSL automático.

## 🎯 Arquitetura

```
Internet
    ↓
DNS Registro.br (helthcorp.com.br → IP_DA_VPS)
    ↓
Traefik (Proxy Reverso + SSL)
    ├── ergonomia.helthcorp.com.br → Frontend
    ├── ergonomia.helthcorp.com.br/api → Backend
    └── traefik.helthcorp.com.br → Dashboard Traefik
    ↓
Containers
    ├── Frontend (React + Nginx)
    ├── Backend (Node.js API)
    └── PostgreSQL (Database)
```

## 📋 Pré-requisitos

- ✅ VPS com Ubuntu 20.04+ ou Debian 11+
- ✅ Mínimo 2GB RAM (recomendado 4GB)
- ✅ Docker 24.0+
- ✅ Domínio `helthcorp.com.br` no Registro.br
- ✅ Acesso SSH à VPS

---

## 1. Configurar DNS no Registro.br

### 1.1 Acessar painel do Registro.br

1. Acesse: https://registro.br
2. Faça login
3. Selecione o domínio `helthcorp.com.br`

### 1.2 Configurar registros DNS

**Opção A: Wildcard (Recomendado - pega todos subdomínios)**

| Tipo | Nome | Valor |
|------|------|-------|
| A | `@` | `SEU_IP_DA_VPS` |
| A | `*` | `SEU_IP_DA_VPS` |

**Opção B: Individual (cada subdomínio separado)**

| Tipo | Nome | Valor |
|------|------|-------|
| A | `@` | `SEU_IP_DA_VPS` |
| A | `ergonomia` | `SEU_IP_DA_VPS` |
| A | `traefik` | `SEU_IP_DA_VPS` |
| A | `www` | `SEU_IP_DA_VPS` |

### 1.3 Aguardar propagação

```bash
# Testar DNS (aguarde 15-30 minutos)
nslookup ergonomia.helthcorp.com.br
ping ergonomia.helthcorp.com.br
```

---

## 2. Preparar Servidor VPS

### 2.1 Conectar via SSH

```bash
ssh root@SEU_IP_DA_VPS
```

### 2.2 Instalar Docker

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker (script oficial)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verificar instalação
docker --version
docker compose version

# Habilitar Docker no boot
systemctl enable docker
systemctl start docker
```

### 2.3 Criar diretório do projeto

```bash
mkdir -p /opt/ergonomia
cd /opt/ergonomia
```

---

## 3. Clonar Código do GitHub

```bash
# Instalar Git (se não tiver)
apt install -y git

# Clonar repositório
cd /opt
git clone https://github.com/daniellinsr/ergonomia.git
cd ergonomia

# Verificar estrutura
ls -la
# Deve conter: backend/, frontend/, traefik/, docker-compose.traefik.yml
```

---

## 4. Configurar Variáveis de Ambiente

### 4.1 Criar arquivo .env

```bash
cd /opt/ergonomia
cp .env.traefik.example .env
nano .env
```

### 4.2 Preencher .env

```env
# Domínio
DOMAIN=ergonomia.helthcorp.com.br

# Let's Encrypt
LETSENCRYPT_EMAIL=seu-email@helthcorp.com.br

# Database
DB_NAME=ergonomia_db
DB_USER=ergonomia_user
DB_PASSWORD=SuaSenhaForte123!@#

# JWT (gerar com comando abaixo)
JWT_SECRET=sua_chave_secreta_64_caracteres_aqui
JWT_REFRESH_SECRET=outra_chave_secreta_diferente_64_caracteres

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
```

### 4.3 Gerar chaves JWT

```bash
# Gerar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Gerar JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copie as chaves geradas e cole no arquivo `.env`.

---

## 5. Preparar Certificados SSL

### 5.1 Criar arquivo acme.json

```bash
mkdir -p /opt/ergonomia/traefik/certificates
touch /opt/ergonomia/traefik/certificates/acme.json
chmod 600 /opt/ergonomia/traefik/certificates/acme.json
```

**Importante**: O arquivo `acme.json` precisa ter permissão 600 (apenas leitura/escrita para owner).

---

## 6. Iniciar Containers

### 6.1 Build e start

```bash
cd /opt/ergonomia

# Usar o docker-compose com Traefik
docker compose -f docker-compose.traefik.yml up -d --build
```

### 6.2 Acompanhar logs

```bash
# Ver todos os logs
docker compose -f docker-compose.traefik.yml logs -f

# Logs do Traefik
docker logs traefik -f

# Logs do Backend
docker logs ergonomia-backend -f

# Logs do Frontend
docker logs ergonomia-frontend -f
```

### 6.3 Verificar status

```bash
docker compose -f docker-compose.traefik.yml ps
```

Todos devem estar com status **Up** e **healthy**.

---

## 7. Executar Migrations do Banco

### 7.1 Aguardar PostgreSQL estar pronto

```bash
# Verificar se PostgreSQL está healthy
docker ps | grep postgres

# Ver logs do PostgreSQL
docker logs ergonomia-postgres
```

### 7.2 Executar migrations

```bash
cd /opt/ergonomia

# Migration 001
docker compose -f docker-compose.traefik.yml exec -T postgres \
  psql -U ergonomia_user -d ergonomia_db < backend/migrations/001_initial_schema.sql

# Migration 002
docker compose -f docker-compose.traefik.yml exec -T postgres \
  psql -U ergonomia_user -d ergonomia_db < backend/migrations/002_planos_acao.sql

# Migration 003
docker compose -f docker-compose.traefik.yml exec -T postgres \
  psql -U ergonomia_user -d ergonomia_db < backend/migrations/003_remover_trabalhadores.sql
```

### 7.3 Verificar tabelas criadas

```bash
docker compose -f docker-compose.traefik.yml exec postgres \
  psql -U ergonomia_user -d ergonomia_db -c "\dt"
```

Deve listar todas as tabelas criadas.

---

## 8. Testar Aplicação

### 8.1 Aguardar certificados SSL

Traefik vai solicitar os certificados automaticamente. Aguarde 1-2 minutos.

Verifique os logs:

```bash
docker logs traefik | grep -i certificate
docker logs traefik | grep -i acme
```

### 8.2 Acessar aplicação

Abra no navegador:

- **Aplicação**: https://ergonomia.helthcorp.com.br
- **API Health**: https://ergonomia.helthcorp.com.br/api/health
- **Dashboard Traefik**: https://traefik.helthcorp.com.br (user: admin / senha: admin)

### 8.3 Verificar SSL

O navegador deve mostrar cadeado verde 🔒

Certificado emitido por: **Let's Encrypt**

---

## 9. Dashboard do Traefik

### 9.1 Alterar senha do dashboard

Por padrão, o usuário é `admin` e senha `admin`.

**Gerar nova senha:**

```bash
# Instalar htpasswd
apt install -y apache2-utils

# Gerar hash da senha
htpasswd -nB admin
```

Copie o resultado (incluindo `admin:$2y$...`).

### 9.2 Atualizar docker-compose

Edite `docker-compose.traefik.yml`:

```bash
nano docker-compose.traefik.yml
```

Encontre a linha:

```yaml
- "traefik.http.middlewares.traefik-auth.basicauth.users=admin:$$2y$$05$$..."
```

Substitua pela nova senha gerada (lembre-se de duplicar os `$` → `$$`).

### 9.3 Reiniciar Traefik

```bash
docker compose -f docker-compose.traefik.yml restart traefik
```

---

## 10. Configurar Firewall (UFW)

### 10.1 Instalar e configurar

```bash
# Instalar UFW
apt install -y ufw

# Configurar regras
ufw default deny incoming
ufw default allow outgoing

# Permitir SSH (IMPORTANTE!)
ufw allow 22/tcp

# Permitir HTTP e HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Ativar firewall
ufw enable

# Ver status
ufw status
```

### 10.2 Verificar portas

```bash
netstat -tulpn | grep LISTEN
```

Deve mostrar:
- `:22` - SSH
- `:80` - HTTP (Traefik)
- `:443` - HTTPS (Traefik)
- `:8080` - Dashboard Traefik (opcional)

---

## 11. Monitoramento

### 11.1 Ver status dos containers

```bash
docker ps
docker compose -f docker-compose.traefik.yml ps
```

### 11.2 Ver logs em tempo real

```bash
# Todos os logs
docker compose -f docker-compose.traefik.yml logs -f

# Log específico
docker logs -f traefik
docker logs -f ergonomia-backend
docker logs -f ergonomia-frontend
docker logs -f ergonomia-postgres
```

### 11.3 Ver uso de recursos

```bash
docker stats
```

### 11.4 Dashboard do Traefik

Acesse: https://traefik.helthcorp.com.br

Visualize:
- **HTTP Routers** - Rotas configuradas
- **Services** - Serviços backend
- **Middlewares** - Middlewares ativos
- **TLS** - Certificados SSL

---

## 12. Backup e Restore

### 12.1 Backup automático

O container `postgres-backup` faz backup diário automaticamente.

**Ver backups:**

```bash
docker exec ergonomia-backup ls -lh /backups/daily
```

**Copiar backup para host:**

```bash
docker cp ergonomia-backup:/backups/daily/ergonomia_db-2024-12-02.sql.gz ./
```

### 12.2 Backup manual

```bash
cd /opt/ergonomia

# Fazer backup
docker compose -f docker-compose.traefik.yml exec postgres \
  pg_dump -U ergonomia_user ergonomia_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Verificar
ls -lh backup_*.sql.gz
```

### 12.3 Restore de backup

```bash
# Descomprimir e restaurar
gunzip < backup_20241202.sql.gz | \
  docker compose -f docker-compose.traefik.yml exec -T postgres \
  psql -U ergonomia_user -d ergonomia_db
```

---

## 13. Atualização da Aplicação

### 13.1 Via Git

```bash
cd /opt/ergonomia

# Atualizar código
git pull

# Rebuild e restart
docker compose -f docker-compose.traefik.yml up -d --build

# Ver logs
docker compose -f docker-compose.traefik.yml logs -f
```

### 13.2 Sem downtime (zero-downtime deployment)

```bash
# Build novas imagens
docker compose -f docker-compose.traefik.yml build

# Restart com rolling update
docker compose -f docker-compose.traefik.yml up -d --no-deps --build backend
docker compose -f docker-compose.traefik.yml up -d --no-deps --build frontend
```

---

## 14. Adicionar Mais Subdomínios (Futuro)

Traefik torna muito fácil adicionar novos projetos.

**Exemplo**: Adicionar `api.helthcorp.com.br`

### 14.1 No DNS (Registro.br)

Se usou wildcard (`*.helthcorp.com.br`), não precisa fazer nada!

Se não usou, adicione:

```
Tipo A: api → SEU_IP_DA_VPS
```

### 14.2 No docker-compose

Adicione labels ao novo container:

```yaml
novo-servico:
  image: novo-servico:latest
  networks:
    - traefik-public
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.novo.rule=Host(`api.helthcorp.com.br`)"
    - "traefik.http.routers.novo.entrypoints=websecure"
    - "traefik.http.routers.novo.tls.certresolver=letsencrypt"
    - "traefik.http.services.novo.loadbalancer.server.port=8000"
```

Pronto! Traefik detecta automaticamente e configura SSL.

---

## 15. Troubleshooting

### Problema: Certificado SSL não foi gerado

**Verificar logs:**

```bash
docker logs traefik | grep -i acme
docker logs traefik | grep -i certificate
```

**Causas comuns:**
- DNS não propagou ainda (aguarde 30 minutos)
- Porta 80 não está acessível
- Email inválido no .env
- Arquivo acme.json com permissão errada

**Solução:**

```bash
# Verificar DNS
nslookup ergonomia.helthcorp.com.br

# Verificar permissão acme.json
ls -l traefik/certificates/acme.json
# Deve mostrar: -rw------- (600)

# Se errado, corrigir:
chmod 600 traefik/certificates/acme.json

# Reiniciar Traefik
docker restart traefik
```

### Problema: Dashboard Traefik não abre

```bash
# Verificar se container está rodando
docker ps | grep traefik

# Ver logs
docker logs traefik

# Verificar porta 8080
netstat -tulpn | grep 8080

# Reiniciar
docker restart traefik
```

### Problema: API não responde

```bash
# Ver logs do backend
docker logs ergonomia-backend

# Verificar saúde
docker inspect ergonomia-backend | grep -A 10 Health

# Testar internamente
docker exec ergonomia-backend wget -O- http://localhost:3001/api/health

# Reiniciar
docker restart ergonomia-backend
```

### Problema: Banco de dados não conecta

```bash
# Ver logs
docker logs ergonomia-postgres

# Testar conexão
docker exec ergonomia-postgres pg_isready -U ergonomia_user

# Verificar senha no .env
cat .env | grep DB_PASSWORD

# Reiniciar
docker restart ergonomia-postgres
```

### Resetar tudo

```bash
# CUIDADO: Remove TODOS os dados!
cd /opt/ergonomia
docker compose -f docker-compose.traefik.yml down -v
docker system prune -af --volumes

# Recomeçar
docker compose -f docker-compose.traefik.yml up -d --build
```

---

## 16. Checklist Final

- [ ] DNS configurado no Registro.br
- [ ] Docker instalado na VPS
- [ ] Código enviado para `/opt/ergonomia`
- [ ] Arquivo `.env` configurado
- [ ] Permissão do `acme.json` correta (600)
- [ ] Containers iniciados (4/4 rodando)
- [ ] Migrations executadas
- [ ] Certificados SSL gerados
- [ ] Site acessível via HTTPS
- [ ] API respondendo
- [ ] Dashboard Traefik acessível
- [ ] Senha do dashboard alterada
- [ ] Firewall configurado
- [ ] Backup automático ativo

---

## 17. Comandos Úteis

```bash
# Ver status
docker compose -f docker-compose.traefik.yml ps

# Logs
docker compose -f docker-compose.traefik.yml logs -f [service]

# Reiniciar
docker compose -f docker-compose.traefik.yml restart [service]

# Parar tudo
docker compose -f docker-compose.traefik.yml down

# Iniciar tudo
docker compose -f docker-compose.traefik.yml up -d

# Rebuild
docker compose -f docker-compose.traefik.yml up -d --build

# Ver uso de recursos
docker stats

# Acessar PostgreSQL
docker compose -f docker-compose.traefik.yml exec postgres psql -U ergonomia_user -d ergonomia_db

# Acessar shell do backend
docker compose -f docker-compose.traefik.yml exec backend sh
```

---

## 🎉 Deploy Finalizado!

Seu sistema está rodando em produção com:

- ✅ SSL automático via Let's Encrypt
- ✅ Proxy reverso com Traefik
- ✅ Containers isolados
- ✅ Backup automático
- ✅ Monitoramento via Dashboard

**URLs:**
- **Aplicação**: https://ergonomia.helthcorp.com.br
- **API**: https://ergonomia.helthcorp.com.br/api
- **Dashboard Traefik**: https://traefik.helthcorp.com.br

**Documentação adicional:**
- [QUICK-START-TRAEFIK.md](QUICK-START-TRAEFIK.md) - Guia rápido
- [README-DOCKER.md](README-DOCKER.md) - Documentação técnica
