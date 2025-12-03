# Sistema de Gestão Ergonômica - Guia de Deployment

Escolha o método de deployment ideal para seu projeto.

## 🎯 Qual Método Usar?

### ⭐ **RECOMENDADO: Traefik + Docker**

**Use se:**
- ✅ Quer usar `helthcorp.com.br` com múltiplos subdomínios
- ✅ Planeja adicionar mais projetos no futuro
- ✅ Quer SSL automático e renovação
- ✅ Busca solução profissional e escalável
- ✅ Tem conhecimento básico de Docker

**👉 Siga:** [QUICK-START-TRAEFIK.md](QUICK-START-TRAEFIK.md) (8 passos)

---

### 🎨 **ALTERNATIVA: Portainer + Nginx Proxy Manager**

**Use se:**
- ✅ Prefere interface gráfica (cliques)
- ✅ Primeira vez com Docker
- ✅ Quer facilidade acima de tudo
- ✅ Poucos domínios

**👉 Siga:** [QUICK-START-PORTAINER.md](QUICK-START-PORTAINER.md) (10 passos)

---

### 🔧 **AVANÇADO: Deployment Tradicional (sem Docker)**

**Use se:**
- ✅ Servidor com poucos recursos
- ✅ Projeto único e simples
- ✅ Experiência em administração Linux
- ✅ Prefere controle total manual

**👉 Siga:** [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📚 Documentação Completa

### Traefik (Recomendado) ⭐

| Documento | Descrição |
|-----------|-----------|
| [QUICK-START-TRAEFIK.md](QUICK-START-TRAEFIK.md) | 🚀 Guia rápido - 8 passos |
| [DEPLOYMENT-TRAEFIK.md](DEPLOYMENT-TRAEFIK.md) | 📖 Guia completo detalhado |

### Portainer

| Documento | Descrição |
|-----------|-----------|
| [QUICK-START-PORTAINER.md](QUICK-START-PORTAINER.md) | 🚀 Guia rápido - 10 passos |
| [DEPLOYMENT-PORTAINER.md](DEPLOYMENT-PORTAINER.md) | 📖 Guia completo detalhado |

### Tradicional

| Documento | Descrição |
|-----------|-----------|
| [QUICK-START-PRODUCTION.md](QUICK-START-PRODUCTION.md) | 🚀 Guia rápido |
| [DEPLOYMENT.md](DEPLOYMENT.md) | 📖 Guia completo detalhado |

### Geral

| Documento | Descrição |
|-----------|-----------|
| [DEPLOYMENT-OPTIONS.md](DEPLOYMENT-OPTIONS.md) | 📊 Comparativo das opções |
| [README-DOCKER.md](README-DOCKER.md) | 🐳 Documentação Docker |
| [DOCKER-SUMMARY.md](DOCKER-SUMMARY.md) | 📋 Resumo executivo Docker |

---

## 🏗️ Arquitetura

### Com Traefik (Recomendado)

```
Internet
    ↓
DNS: *.helthcorp.com.br → VPS_IP
    ↓
Traefik (Proxy Reverso + SSL)
    ├── ergonomia.helthcorp.com.br → Frontend
    ├── ergonomia.helthcorp.com.br/api → Backend
    ├── traefik.helthcorp.com.br → Dashboard
    └── [fácil adicionar mais...]
    ↓
Containers Docker
    ├── Frontend (React + Nginx)
    ├── Backend (Node.js)
    └── PostgreSQL
```

**Vantagens:**
- SSL automático para todos os subdomínios
- Adicionar novos projetos = apenas labels
- Dashboard de monitoramento
- Zero-downtime deploys

---

## 📦 Estrutura do Projeto

```
ergonomia/
├── backend/
│   ├── src/
│   ├── migrations/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── traefik/
│   ├── traefik.yml              # Config Traefik
│   └── dynamic/
│       └── middlewares.yml       # Middlewares
├── docker-compose.traefik.yml    # ⭐ Compose com Traefik
├── docker-compose.yml            # Compose básico
├── .env.traefik.example          # ⭐ Env para Traefik
├── .env.docker.example           # Env para Portainer
└── Guias de deployment...
```

---

## 🚀 Deploy Rápido (Traefik)

```bash
# 1. Configurar DNS
# Registro.br: *.helthcorp.com.br → VPS_IP

# 2. Instalar Docker
ssh root@VPS_IP
curl -fsSL https://get.docker.com | sh

# 3. Enviar código
scp -r ergonomia/ root@VPS_IP:/opt/

# 4. Configurar
cd /opt/ergonomia
cp .env.traefik.example .env
nano .env  # preencher

# 5. Iniciar
docker compose -f docker-compose.traefik.yml up -d --build

# 6. Migrations
docker compose -f docker-compose.traefik.yml exec -T postgres \
  psql -U ergonomia_user -d ergonomia_db < backend/migrations/001_initial_schema.sql

# Pronto! https://ergonomia.helthcorp.com.br
```

Detalhes: [QUICK-START-TRAEFIK.md](QUICK-START-TRAEFIK.md)

---

## 🔧 Desenvolvimento Local

```bash
# 1. Copiar .env
cp .env.traefik.example .env

# 2. Editar credenciais
nano .env

# 3. Iniciar
docker compose -f docker-compose.traefik.yml up -d --build

# 4. Acessar
# http://localhost - Frontend
# http://localhost:8080 - Dashboard Traefik
```

---

## 📊 Comparação Rápida

| Característica | Tradicional | Portainer | **Traefik** ⭐ |
|----------------|-------------|-----------|---------------|
| Interface Visual | ❌ | ✅ | ✅ |
| SSL Automático | ❌ Manual | ✅ | ✅ |
| Multi-domínio | Trabalhoso | Manual | **Automático** |
| Escalabilidade | ⭐ | ⭐⭐ | ⭐⭐⭐ |
| Dificuldade | Alta | Baixa | Média |
| Produção | Sim | Sim | **Ideal** |

**Recomendação: Use Traefik!** ⭐

---

## ✅ Checklist de Deploy

### Pré-deployment

- [ ] VPS configurada com Ubuntu/Debian
- [ ] Docker instalado (`docker --version`)
- [ ] Domínio `helthcorp.com.br` registrado
- [ ] DNS configurado no Registro.br
- [ ] Código baixado/clonado

### Durante deployment

- [ ] Arquivo `.env` configurado
- [ ] Chaves JWT geradas
- [ ] Containers iniciados
- [ ] Migrations executadas
- [ ] Certificados SSL gerados

### Pós-deployment

- [ ] Site acessível via HTTPS
- [ ] API respondendo
- [ ] Login funcionando
- [ ] Backup automático configurado
- [ ] Senha do dashboard alterada
- [ ] Firewall configurado

---

## 🆘 Problemas Comuns

### SSL não gerou

```bash
# Ver logs do Traefik
docker logs traefik | grep -i acme

# Verificar DNS
nslookup ergonomia.helthcorp.com.br

# Verificar permissão acme.json
ls -l traefik/certificates/acme.json
# Deve ser: -rw------- (600)
```

### API não responde

```bash
# Ver logs
docker logs ergonomia-backend

# Reiniciar
docker restart ergonomia-backend
```

### Banco não conecta

```bash
# Ver logs
docker logs ergonomia-postgres

# Testar
docker exec ergonomia-postgres pg_isready
```

**Mais detalhes:** Seção Troubleshooting nos guias completos.

---

## 📞 URLs em Produção

Após deployment com Traefik:

- **Aplicação**: https://ergonomia.helthcorp.com.br
- **API Health**: https://ergonomia.helthcorp.com.br/api/health
- **Dashboard Traefik**: https://traefik.helthcorp.com.br
  - User: `admin`
  - Senha: `admin` (alterar!)

---

## 🔄 Atualização

```bash
cd /opt/ergonomia
git pull  # ou enviar novos arquivos
docker compose -f docker-compose.traefik.yml up -d --build
```

---

## 📦 Backup

```bash
# Backup automático
# O container postgres-backup faz diariamente

# Backup manual
docker compose -f docker-compose.traefik.yml exec postgres \
  pg_dump -U ergonomia_user ergonomia_db | gzip > backup.sql.gz
```

---

## 💡 Dicas

1. **Use Traefik** - É moderno, automático e escalável ⭐
2. **Configure wildcard DNS** - `*.helthcorp.com.br` facilita muito
3. **Monitore o Dashboard** - Traefik mostra tudo em tempo real
4. **Altere senhas padrão** - Dashboard, PostgreSQL, etc
5. **Configure firewall** - UFW com portas 22, 80, 443
6. **Faça backups** - Já está automático, mas teste restore

---

## 📚 Próximos Passos

1. **Escolha o método**: Recomendamos Traefik ⭐
2. **Leia o guia rápido**: [QUICK-START-TRAEFIK.md](QUICK-START-TRAEFIK.md)
3. **Configure DNS**: Registro.br com wildcard
4. **Faça o deploy**: Siga os 8 passos
5. **Teste tudo**: Acesse via HTTPS
6. **Configure segurança**: Firewall, senhas, etc

---

## 🎉 Pronto para Deploy!

Escolha seu método e comece:

- 🚀 **Rápido e Fácil**: [QUICK-START-TRAEFIK.md](QUICK-START-TRAEFIK.md)
- 📖 **Detalhado**: [DEPLOYMENT-TRAEFIK.md](DEPLOYMENT-TRAEFIK.md)
- 🎨 **Interface Visual**: [QUICK-START-PORTAINER.md](QUICK-START-PORTAINER.md)

Boa sorte com o deployment! 🚀
