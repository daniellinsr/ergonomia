# 🔧 Correção: Erro de Deploy no Portainer

## ❌ Erro Original

```
Deployment error
Services.postgres-backup.depends_on must be a list
```

## ✅ Correção Aplicada

O problema ocorreu porque o Portainer tem compatibilidade limitada com a sintaxe avançada do `depends_on` com condições de healthcheck.

### O que foi alterado

**Antes (sintaxe avançada - não compatível com Portainer):**

```yaml
depends_on:
  postgres:
    condition: service_healthy
```

**Depois (sintaxe simples - compatível):**

```yaml
depends_on:
  - postgres
```

### Serviços corrigidos

1. ✅ **backend** - Corrigido `depends_on` do postgres
2. ✅ **postgres-backup** - Corrigido `depends_on` do postgres

## 📝 O que isso significa?

### Antes
Os containers aguardavam o postgres estar **healthy** (com healthcheck passando) antes de iniciar.

### Agora
Os containers aguardam o postgres **iniciar** (mas não necessariamente estar healthy).

### Impacto
**Mínimo!** O PostgreSQL geralmente inicia em poucos segundos, e tanto o backend quanto o backup têm:

1. **Backend:**
   - Retry automático de conexão com o banco
   - Healthcheck próprio que só passa quando consegue conectar
   - Restart automático se falhar

2. **Postgres-backup:**
   - Aguarda o postgres estar pronto antes de fazer backup
   - Não afeta funcionamento do sistema

## 🚀 Como fazer o deploy agora

### No Portainer

1. **Stacks** → **+ Add stack**
2. **Name:** `ergonomia`
3. **Build method:** Repository
4. **Repository URL:** `https://github.com/daniellinsr/ergonomia.git`
5. **Reference:** `refs/heads/main`
6. **Compose path:** `docker-compose.yml`
7. Adicionar variáveis de ambiente
8. **Deploy the stack**

### Verificar se funcionou

Após o deploy, aguarde ~30-60 segundos e verifique:

```bash
# Via Portainer: Containers → Ver status

# Via SSH:
docker ps | grep ergonomia

# Deve mostrar todos rodando:
ergonomia-frontend
ergonomia-backend
ergonomia-postgres
ergonomia-backup
```

### Verificar logs

```bash
# Backend
docker logs ergonomia-backend --tail 50

# Deve mostrar algo como:
# "Server running on port 3001"
# "Database connected successfully"
```

## 🔍 Troubleshooting

### Se o backend não conectar ao postgres

**Isso é normal nos primeiros 10-30 segundos!**

O postgres leva alguns segundos para inicializar. O backend vai tentar reconectar automaticamente.

Verifique os logs:

```bash
docker logs ergonomia-backend -f
```

Aguarde aparecer: `Database connected successfully`

### Se persistir o erro de conexão

1. Verificar se o postgres está healthy:
   ```bash
   docker exec ergonomia-postgres pg_isready -U ergonomia_user
   ```

2. Verificar senha no .env:
   ```bash
   # No Portainer, conferir variável DB_PASSWORD
   ```

3. Reiniciar o backend:
   ```bash
   docker restart ergonomia-backend
   ```

## ✅ Arquivos Afetados

- ✅ [docker-compose.yml](docker-compose.yml) - Corrigido
- ✅ Compatível com Portainer
- ✅ Compatível com Docker Compose v3.8
- ✅ Compatível com `docker compose` e `docker-compose`

## 📚 Referências

- **Portainer Docs:** https://docs.portainer.io/user/docker/stacks
- **Docker Compose Spec:** https://docs.docker.com/compose/compose-file/compose-file-v3/#depends_on
- **Guia de Deploy:** [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md)

---

**Problema resolvido!** 🎉

Agora você pode fazer o deploy normalmente via Portainer.

Próximo passo: [DEPLOY-RAPIDO.md](DEPLOY-RAPIDO.md)
