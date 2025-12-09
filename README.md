# Sistema de Gestão Ergonômica

Sistema completo de gestão ergonômica com avaliações, planos de ação e relatórios.

## 🚀 Repositório

**GitHub**: https://github.com/daniellinsr/ergonomia.git

## 📦 Estrutura do Projeto

```
ergonomia/
├── backend/              # API Node.js/Express
│   ├── src/
│   ├── migrations/
│   ├── Dockerfile
│   └── package.json
├── frontend/             # React + Vite
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── traefik/              # Configuração Traefik
│   ├── traefik.yml
│   └── dynamic/
├── docker-compose.yml            # Compose básico
├── docker-compose.traefik.yml    # Compose com Traefik
├── .gitignore                    # Arquivos ignorados
├── .env.docker.example           # Template env Portainer
├── .env.traefik.example          # Template env Traefik
└── Documentação de deployment
```

## ⚠️ Arquivos NÃO Commitados (no .gitignore)

**Por segurança, os seguintes arquivos NÃO estão no GitHub:**

### Variáveis de Ambiente
- `.env` - Credenciais de produção
- `.env.local`
- `.env.production`
- `*.env` (todos os .env exceto .example)

### Build e Dependências
- `node_modules/`
- `dist/`
- `build/`
- `package-lock.json`

### Certificados SSL
- `traefik/certificates/acme.json`
- `*.pem`, `*.key`, `*.crt`

### Backups e Dados
- `*.sql`, `*.sql.gz`
- `backups/`
- `*.db`

### Logs
- `*.log`
- `logs/`

**Veja o arquivo completo**: [.gitignore](.gitignore)

## 🔐 Configuração de Segurança

### Antes do Primeiro Commit

1. **NUNCA commite** arquivos `.env` com credenciais reais
2. Use sempre os arquivos `.env.example` como template
3. Gere novas chaves JWT para cada ambiente
4. Altere senhas padrão do banco de dados

### Gerar Chaves JWT

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📚 Documentação de Deploy

### ⭐ Recomendado: Portainer + Traefik

Se você já tem **Traefik e Portainer** rodando no seu servidor:

**📄 [DEPLOY-PORTAINER-ATUALIZADO.md](DEPLOY-PORTAINER-ATUALIZADO.md)** - Deploy via Portainer (Upload Manual)

Este guia assume que você já tem:
- ✅ Traefik rodando com rede externa `web`
- ✅ Portainer instalado e configurado
- ✅ Domínio apontando para o servidor

**Tempo:** ~10 minutos | **Dificuldade:** ⭐⭐☆☆☆

### Outras Opções de Deploy

| Método | Guia Rápido | Guia Completo |
|--------|-------------|---------------|
| **Traefik do Zero** | [QUICK-START-TRAEFIK.md](QUICK-START-TRAEFIK.md) | [DEPLOYMENT-TRAEFIK.md](DEPLOYMENT-TRAEFIK.md) |
| **Portainer do Zero** | [QUICK-START-PORTAINER.md](QUICK-START-PORTAINER.md) | [DEPLOYMENT-PORTAINER.md](DEPLOYMENT-PORTAINER.md) |
| **Tradicional** | [QUICK-START-PRODUCTION.md](QUICK-START-PRODUCTION.md) | [DEPLOYMENT.md](DEPLOYMENT.md) |

### Comparação

📄 [DEPLOYMENT-OPTIONS.md](DEPLOYMENT-OPTIONS.md) - Comparativo detalhado

### Índice Geral

📄 [README-DEPLOYMENT.md](README-DEPLOYMENT.md) - Guia principal de deployment

## 🚀 Deploy Rápido

### Com Traefik + Portainer Existente (Mais Fácil) ⭐

Se você já tem Traefik e Portainer rodando:

#### Primeiro: Identificar seu ambiente

```bash
# Via SSH no servidor
docker info | grep -i swarm

# Se retornar "Swarm: active" → Use guia Swarm
# Se retornar "Swarm: inactive" → Use guia Standalone
```

#### Passos básicos:

```bash
# 1. No servidor, clonar repositório e fazer build
git clone https://github.com/daniellinsr/ergonomia.git /opt/apps/ergonomia
cd /opt/apps/ergonomia

# 2. Build das imagens
docker build -t ergonomia-backend:latest backend/
docker build -t ergonomia-frontend:latest --build-arg VITE_API_URL=/api frontend/

# 3. No Portainer: Criar Stack com Web editor
#    - Colar compose do guia correspondente
#    - Adicionar variáveis de ambiente
#    - Deploy!

# 4. Executar migrations
docker exec -i ergonomia-postgres psql -U ergonomia_user -d ergonomia_db < backend/migrations/001_initial_schema.sql
```

**Guias disponíveis:**
- 📄 **[QUAL-GUIA-SEGUIR.md](QUAL-GUIA-SEGUIR.md)** - Identificar ambiente e escolher guia
- 📄 **[DEPLOY-PORTAINER-SWARM.md](DEPLOY-PORTAINER-SWARM.md)** - Para Docker Swarm
- 📄 **[DEPLOY-PORTAINER-ATUALIZADO.md](DEPLOY-PORTAINER-ATUALIZADO.md)** - Para Docker Standalone

### Instalando Traefik do Zero

```bash
# 1. Clonar repositório no servidor
git clone https://github.com/daniellinsr/ergonomia.git
cd ergonomia

# 2. Configurar .env
cp .env.traefik.example .env
nano .env  # Preencher credenciais

# 3. Iniciar
docker compose -f docker-compose.traefik.yml up -d --build

# 4. Executar migrations
docker compose -f docker-compose.traefik.yml exec -T postgres \
  psql -U ergonomia_user -d ergonomia_db < backend/migrations/001_initial_schema.sql
```

**Detalhes**: [QUICK-START-TRAEFIK.md](QUICK-START-TRAEFIK.md)

## 🛠️ Desenvolvimento Local

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Com Docker

```bash
# Copiar .env
cp .env.docker.example .env

# Editar credenciais
nano .env

# Iniciar todos os serviços
docker compose up -d --build

# Ver logs
docker compose logs -f
```

## 🔄 Atualização

### No servidor (produção)

```bash
cd /opt/ergonomia  # ou /root/ergonomia

# Atualizar código
git pull

# Rebuild containers
docker compose -f docker-compose.traefik.yml up -d --build
```

## 📦 Tecnologias

### Backend
- Node.js 20
- Express
- PostgreSQL 15
- JWT Authentication

### Frontend
- React 18
- Vite
- Tailwind CSS
- Recharts

### Infraestrutura
- Docker
- Traefik (Proxy Reverso)
- Nginx (Serve Frontend)
- Let's Encrypt (SSL)

## 🤝 Contribuindo

1. Clone o repositório
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📝 Variáveis de Ambiente

### Criar arquivo .env

```bash
# Para Traefik
cp .env.traefik.example .env

# Para Portainer
cp .env.docker.example .env
```

### Variáveis Obrigatórias

```env
# Database
DB_PASSWORD=senha_forte_aqui

# JWT (gerar com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=chave_64_caracteres
JWT_REFRESH_SECRET=outra_chave_64_caracteres

# Let's Encrypt (se usar Traefik)
LETSENCRYPT_EMAIL=seu-email@helthcorp.com.br
```

## 🔒 Segurança

- ✅ Autenticação JWT
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ Headers de segurança
- ✅ SSL/TLS (HTTPS)
- ✅ Senhas criptografadas (bcrypt)
- ✅ Sanitização de inputs
- ✅ Proteção contra SQL injection
- ✅ Containers não-root

## 📊 Features

- ✅ Cadastro de empresas, unidades e setores
- ✅ Avaliações ergonômicas (61 perigos catalogados)
- ✅ Classificação de riscos (matriz 5x5)
- ✅ Planos de ação (5W2H, PDCA, Ações Corretivas)
- ✅ Relatórios detalhados
- ✅ Dashboards interativos
- ✅ Gestão de usuários (4 perfis)
- ✅ Audit log completo
- ✅ Backup automático

## 📞 Suporte

- **Documentação**: Ver pasta de documentação no repositório
- **Issues**: https://github.com/daniellinsr/ergonomia/issues

## 📄 Licença

Propriedade de HealthCorp - Todos os direitos reservados.

---

**Deploy realizado com sucesso?** 🎉

Acesse: https://ergonomia.helthcorp.com.br
