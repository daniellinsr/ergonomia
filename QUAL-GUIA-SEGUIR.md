# 🤔 Qual Guia Seguir?

Escolha o guia correto baseado no seu ambiente.

## 🔍 Passo 1: Identificar seu ambiente

### Via SSH no servidor:

```bash
docker info | grep -i swarm
```

**Resultado e ação:**

| Resultado | Significa | Guia |
|-----------|-----------|------|
| `Swarm: active` | Docker Swarm habilitado | ⬇️ **Opção A** |
| `Swarm: inactive` | Docker standalone | ⬇️ **Opção B** |

---

## 🅰️ Opção A: Docker Swarm (Swarm: active)

### ✅ Seu ambiente é Swarm se:
- Portainer mostra "Swarm" na interface
- Você criou um cluster Swarm
- Usa `docker service` ao invés de `docker ps`
- Tem vários nodes (ou possibilidade de adicionar)

### 📄 Guia a seguir:

**[DEPLOY-PORTAINER-SWARM.md](DEPLOY-PORTAINER-SWARM.md)** ⭐

**Características:**
- Usa `docker-compose.swarm.yml`
- Rede `overlay` ao invés de `bridge`
- Labels em `deploy.labels`
- Sem opção `restart` (usa `deploy`)
- Suporta múltiplas réplicas

**Tempo:** ~15 minutos

---

## 🅱️ Opção B: Docker Standalone (Swarm: inactive)

### ✅ Seu ambiente é Standalone se:
- Usa Docker normal (não cluster)
- Um único servidor
- Usa `docker-compose up/down`
- Portainer não mostra "Swarm"

### 📄 Guia a seguir:

**[DEPLOY-PORTAINER-ATUALIZADO.md](DEPLOY-PORTAINER-ATUALIZADO.md)** ⭐

**Características:**
- Usa `docker-compose.yml` normal
- Rede `bridge` (ou `web` externa)
- Labels direto no serviço
- Opção `restart: unless-stopped`
- Sem réplicas

**Tempo:** ~10 minutos

---

## 🚨 Erros Comuns e Soluções

### Erro: "network 'web' is not in the right scope: 'local' instead of 'swarm'"

**❌ Você está:** Usando compose standalone em ambiente Swarm

**✅ Solução:** Use [DEPLOY-PORTAINER-SWARM.md](DEPLOY-PORTAINER-SWARM.md)

```bash
# Criar rede overlay
docker network create --driver overlay --attachable web
```

---

### Erro: "Ignoring unsupported options: build"

**❌ Você está:** Tentando fazer build via Git no Portainer

**✅ Solução:** Fazer build local primeiro (ambos os guias já explicam)

```bash
# No servidor via SSH
cd /opt/apps/ergonomia
docker build -t ergonomia-backend:latest backend/
docker build -t ergonomia-frontend:latest --build-arg VITE_API_URL=/api frontend/
```

---

### Erro: "depends_on must be a list"

**❌ Você está:** Usando sintaxe antiga de depends_on

**✅ Solução:** Já corrigido! Use os guias atualizados.

---

## 🎯 Resumo Rápido

### Para Swarm:

```bash
# 1. Verificar rede
docker network create --driver overlay --attachable web

# 2. Build imagens
cd /opt/apps/ergonomia
docker build -t ergonomia-backend:latest backend/
docker build -t ergonomia-frontend:latest --build-arg VITE_API_URL=/api frontend/

# 3. No Portainer: usar docker-compose.swarm.yml
# 4. Deploy!
```

### Para Standalone:

```bash
# 1. Verificar rede
docker network create web

# 2. Build imagens
cd /opt/apps/ergonomia
docker build -t ergonomia-backend:latest backend/
docker build -t ergonomia-frontend:latest --build-arg VITE_API_URL=/api frontend/

# 3. No Portainer: usar docker-compose normal
# 4. Deploy!
```

---

## 📚 Índice de Guias

| Guia | Quando Usar |
|------|-------------|
| [DEPLOY-PORTAINER-SWARM.md](DEPLOY-PORTAINER-SWARM.md) | Docker Swarm (cluster) |
| [DEPLOY-PORTAINER-ATUALIZADO.md](DEPLOY-PORTAINER-ATUALIZADO.md) | Docker Standalone (normal) |
| [CHECKLIST-PRE-DEPLOY.md](CHECKLIST-PRE-DEPLOY.md) | Validar antes de qualquer deploy |
| [TRAEFIK-CONFIG-REFERENCE.md](TRAEFIK-CONFIG-REFERENCE.md) | Verificar config Traefik |
| [FIX-PORTAINER-DEPLOY.md](FIX-PORTAINER-DEPLOY.md) | Erros e soluções |

---

## ❓ Ainda com dúvida?

### Método mais fácil:

1. Tente o guia **Standalone** primeiro
2. Se der erro de "swarm scope", use o guia **Swarm**

### Perguntar no servidor:

```bash
# Este comando mostra tudo sobre seu ambiente
docker version
docker info | grep -A 10 Swarm
docker network ls
```

Copie a saída e analise:
- Se tem "Swarm: active" → Use Swarm
- Se tem "Swarm: inactive" → Use Standalone

---

**Identificou seu ambiente?** Siga o guia correspondente! 🚀
