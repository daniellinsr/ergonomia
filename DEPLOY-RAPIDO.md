# 🚀 Deploy Rápido - Sistema de Ergonomia

Guia ultrarrápido para deploy no seu servidor com Traefik e Portainer já configurados.

## ⚡ Pré-requisitos Confirmados

✅ Traefik rodando na rede `web`
✅ Portainer funcionando
✅ Domínio: `ergonomia.helthcorp.com.br` apontando para o servidor

## 📝 Passo a Passo (5 minutos)

### 1️⃣ Gerar Chaves JWT (no seu computador)

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copie as duas chaves geradas! 🔑

### 2️⃣ No Portainer

**Acesse:** https://portainer.helthcorp.com.br

1. **Stacks** → **+ Add stack**
2. **Name:** `ergonomia`
3. **Build method:** Repository

**Git Repository:**
- **URL:** `https://github.com/daniellinsr/ergonomia.git`
- **Reference:** `refs/heads/main`
- **Compose path:** `docker-compose.yml`

### 3️⃣ Variáveis de Ambiente

Clique em **+ add environment variable** e adicione:

```env
DB_NAME=ergonomia_db
DB_USER=ergonomia_user
DB_PASSWORD=SuaSenhaForte123!
JWT_SECRET=primeira_chave_que_voce_gerou
JWT_EXPIRES_IN=8h
JWT_REFRESH_SECRET=segunda_chave_que_voce_gerou
JWT_REFRESH_EXPIRES_IN=7d
TRAEFIK_HOST=ergonomia.helthcorp.com.br
FRONTEND_URL=https://ergonomia.helthcorp.com.br
VITE_API_URL=/api
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
```

**Clique:** **Deploy the stack** 🚀

### 4️⃣ Executar Migration (após containers iniciarem)

**Via Portainer Console:**

1. **Containers** → `ergonomia-postgres` → **Console**
2. **Connect**
3. Execute:

```bash
psql -U ergonomia_user -d ergonomia_db < /docker-entrypoint-initdb.d/001_initial_schema.sql
```

**OU via SSH:**

```bash
docker exec -i ergonomia-postgres psql -U ergonomia_user -d ergonomia_db < /opt/apps/ergonomia/backend/migrations/001_initial_schema.sql
```

### 5️⃣ Acessar

**URL:** https://ergonomia.helthcorp.com.br

**Login inicial:**
- Email: `admin@sistema.com`
- Senha: `admin123`

⚠️ **ALTERE A SENHA IMEDIATAMENTE!**

## ✅ Verificações

### Containers rodando?

No Portainer → **Containers**, todos devem estar **healthy/running**:

- ✅ `ergonomia-frontend`
- ✅ `ergonomia-backend`
- ✅ `ergonomia-postgres`
- ✅ `ergonomia-backup`

### SSL funcionando?

```bash
curl -I https://ergonomia.helthcorp.com.br
```

Deve retornar `HTTP/2 200` com certificado válido.

### Logs ok?

```bash
docker logs ergonomia-backend --tail 50
docker logs ergonomia-frontend --tail 50
```

Não deve ter erros críticos.

## 🔧 Troubleshooting Rápido

### Não acessa o site?

```bash
# Verificar Traefik
docker logs traefik --tail 100 | grep ergonomia

# Verificar rede
docker inspect ergonomia-frontend | grep -A 5 Networks
```

### Erro de banco?

```bash
# Testar conexão
docker exec ergonomia-postgres pg_isready -U ergonomia_user

# Ver logs
docker logs ergonomia-postgres --tail 50
```

### Frontend não carrega?

```bash
# Rebuild do frontend
docker compose up -d --build frontend

# Ver logs
docker logs ergonomia-frontend -f
```

## 📱 Próximos Passos

1. ✅ Alterar senha do admin
2. ✅ Criar sua empresa
3. ✅ Criar suas unidades e setores
4. ✅ Adicionar usuários
5. ✅ Fazer primeira avaliação

## 🆘 Precisa de Ajuda?

**Guia completo:** [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md)

**Comandos úteis:**

```bash
# Ver todos os logs
docker compose logs -f

# Reiniciar tudo
docker compose restart

# Parar tudo
docker compose down

# Rebuild completo
docker compose up -d --build --force-recreate
```

---

**Tempo estimado:** 5-10 minutos
**Dificuldade:** ⭐⭐☆☆☆ (Fácil)
