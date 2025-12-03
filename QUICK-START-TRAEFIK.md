# Guia Rápido - Deploy com Traefik

Deploy em **8 passos simples** com SSL automático!

## Passo 1: Configurar DNS no Registro.br

Acesse https://registro.br e configure:

| Tipo | Nome | Valor |
|------|------|-------|
| A | `@` | `SEU_IP_DA_VPS` |
| A | `*` | `SEU_IP_DA_VPS` |

*Wildcard `*` pega todos os subdomínios automaticamente!*

## Passo 2: Instalar Docker na VPS

```bash
ssh root@SEU_IP_DA_VPS

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Verificar
docker --version
```

## Passo 3: Clonar repositório

```bash
ssh root@SEU_IP_DA_VPS

# Instalar Git
apt install -y git

# Clonar
cd /opt
git clone https://github.com/daniellinsr/ergonomia.git
cd ergonomia
```

## Passo 4: Configurar .env

```bash
cp .env.traefik.example .env
nano .env
```

Preencha:

```env
DOMAIN=ergonomia.helthcorp.com.br
LETSENCRYPT_EMAIL=seu-email@helthcorp.com.br
DB_PASSWORD=SuaSenhaForte123!
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
```

**Gerar chaves JWT:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Passo 5: Preparar certificados

```bash
mkdir -p traefik/certificates
touch traefik/certificates/acme.json
chmod 600 traefik/certificates/acme.json
```

## Passo 6: Iniciar containers

```bash
docker compose -f docker-compose.traefik.yml up -d --build
```

Aguarde 5-10 minutos para build.

**Ver progresso:**

```bash
docker compose -f docker-compose.traefik.yml logs -f
```

## Passo 7: Executar migrations

```bash
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

## Passo 8: Testar!

Aguarde 1-2 minutos para Traefik gerar certificados SSL.

**Acessar:**

- **App**: https://ergonomia.helthcorp.com.br
- **API**: https://ergonomia.helthcorp.com.br/api/health
- **Traefik Dashboard**: https://traefik.helthcorp.com.br
  - User: `admin`
  - Senha: `admin` (ALTERAR depois!)

---

## ✅ Verificar Status

```bash
# Ver containers
docker ps

# Status
docker compose -f docker-compose.traefik.yml ps

# Logs
docker logs traefik
docker logs ergonomia-backend
docker logs ergonomia-frontend

# Certificados SSL
docker logs traefik | grep -i certificate
```

---

## 🔧 Comandos Úteis

```bash
# Reiniciar tudo
docker compose -f docker-compose.traefik.yml restart

# Ver logs em tempo real
docker compose -f docker-compose.traefik.yml logs -f

# Backup do banco
docker compose -f docker-compose.traefik.yml exec postgres \
  pg_dump -U ergonomia_user ergonomia_db | gzip > backup.sql.gz

# Acessar PostgreSQL
docker compose -f docker-compose.traefik.yml exec postgres \
  psql -U ergonomia_user -d ergonomia_db

# Ver uso de recursos
docker stats
```

---

## 🔒 Alterar Senha do Dashboard

```bash
# Gerar nova senha
apt install -y apache2-utils
htpasswd -nB admin

# Copiar resultado e editar docker-compose
nano docker-compose.traefik.yml

# Encontrar linha (duplicar $ para $$):
# traefik.http.middlewares.traefik-auth.basicauth.users=admin:$$2y$$...

# Reiniciar
docker restart traefik
```

---

## 🔥 Firewall

```bash
apt install -y ufw
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## 🎯 Adicionar Novo Subdomínio (Futuro)

Com wildcard DNS já configurado, basta adicionar labels no container:

```yaml
novo-servico:
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.novo.rule=Host(`api.helthcorp.com.br`)"
    - "traefik.http.routers.novo.entrypoints=websecure"
    - "traefik.http.routers.novo.tls.certresolver=letsencrypt"
```

Traefik detecta automaticamente e configura SSL! 🚀

---

## 📊 Monitorar

**Dashboard Traefik**: https://traefik.helthcorp.com.br

Veja:
- Rotas ativas
- Certificados SSL
- Tráfego em tempo real
- Middlewares

---

## 🆘 Problemas?

### SSL não gerou?

```bash
# Ver logs
docker logs traefik | grep -i acme

# Verificar DNS
nslookup ergonomia.helthcorp.com.br

# Verificar permissão
ls -l traefik/certificates/acme.json
# Deve ser: -rw------- (600)

# Corrigir se necessário
chmod 600 traefik/certificates/acme.json
docker restart traefik
```

### API não responde?

```bash
docker logs ergonomia-backend
docker restart ergonomia-backend
```

### Resetar tudo?

```bash
# CUIDADO: Apaga dados!
docker compose -f docker-compose.traefik.yml down -v
docker compose -f docker-compose.traefik.yml up -d --build
```

---

## 🎉 Pronto!

Sistema em produção com:
- ✅ SSL automático
- ✅ Proxy reverso profissional
- ✅ Backup automático diário
- ✅ Dashboard de monitoramento

**URLs:**
- App: https://ergonomia.helthcorp.com.br
- Dashboard: https://traefik.helthcorp.com.br

**Guia completo**: [DEPLOYMENT-TRAEFIK.md](DEPLOYMENT-TRAEFIK.md)
