# ✅ Checklist Pré-Deploy - Sistema de Ergonomia

Use este checklist para garantir que tudo está pronto antes do deploy.

## 🔧 Infraestrutura

### Traefik
- [ ] Traefik está rodando: `docker ps | grep traefik`
- [ ] Rede `web` existe: `docker network ls | grep web`
- [ ] Porta 80 está livre ou sendo usada pelo Traefik
- [ ] Porta 443 está livre ou sendo usada pelo Traefik
- [ ] Arquivo `/docker/traefik/acme.json` existe e tem permissão 600

### Portainer
- [ ] Portainer está acessível: https://portainer.helthcorp.com.br
- [ ] Você tem acesso admin ao Portainer
- [ ] Pode criar stacks no Portainer

### DNS
- [ ] Domínio `ergonomia.helthcorp.com.br` aponta para o IP do servidor
- [ ] Testar: `nslookup ergonomia.helthcorp.com.br`
- [ ] Testar: `ping ergonomia.helthcorp.com.br`

## 🔐 Segurança

### Senhas e Chaves
- [ ] Gerou senha forte para o banco de dados (mínimo 16 caracteres)
- [ ] Gerou JWT_SECRET único (64 bytes hex):
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- [ ] Gerou JWT_REFRESH_SECRET único (64 bytes hex):
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- [ ] Salvou as credenciais em local seguro (ex: gerenciador de senhas)

### Firewall
- [ ] Porta 22 (SSH) aberta e protegida
- [ ] Porta 80 (HTTP) aberta
- [ ] Porta 443 (HTTPS) aberta
- [ ] Porta 5432 (PostgreSQL) **BLOQUEADA** externamente (apenas local)

## 📦 Arquivos e Configuração

### Repositório
- [ ] Repositório acessível: https://github.com/daniellinsr/ergonomia.git
- [ ] Branch `main` existe
- [ ] Arquivo `docker-compose.yml` está atualizado
- [ ] Migrations estão na pasta `backend/migrations/`

### Variáveis de Ambiente
Confirme que tem estas variáveis preparadas:

```env
DB_NAME=ergonomia_db
DB_USER=ergonomia_user
DB_PASSWORD=[SUA_SENHA_FORTE]
JWT_SECRET=[SUA_CHAVE_JWT_1]
JWT_EXPIRES_IN=8h
JWT_REFRESH_SECRET=[SUA_CHAVE_JWT_2]
JWT_REFRESH_EXPIRES_IN=7d
TRAEFIK_HOST=ergonomia.helthcorp.com.br
FRONTEND_URL=https://ergonomia.helthcorp.com.br
VITE_API_URL=/api
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
```

## 🚀 Comandos de Verificação

Execute estes comandos no servidor ANTES do deploy:

### 1. Verificar Docker
```bash
docker --version
# Deve retornar: Docker version 20.x ou superior
```

### 2. Verificar Traefik
```bash
docker ps | grep traefik
# Deve mostrar o container traefik rodando
```

### 3. Verificar Rede Web
```bash
docker network inspect web
# Deve retornar informações da rede
```

### 4. Verificar Espaço em Disco
```bash
df -h
# Confirmar que tem pelo menos 10GB livres
```

### 5. Verificar Memória
```bash
free -h
# Confirmar que tem pelo menos 2GB de RAM disponível
```

### 6. Verificar DNS
```bash
nslookup ergonomia.helthcorp.com.br
# Deve retornar o IP do seu servidor
```

### 7. Testar Conectividade SSL
```bash
curl -I https://portainer.helthcorp.com.br
# Deve retornar HTTP/2 200 com certificado válido
```

## 📋 Checklist de Deploy

### Antes do Deploy
- [ ] Todos os itens acima foram verificados
- [ ] Backups do servidor estão atualizados
- [ ] Tem acesso SSH ao servidor
- [ ] Tem as credenciais do Portainer

### Durante o Deploy
- [ ] Stack criada no Portainer com nome `ergonomia`
- [ ] Variáveis de ambiente configuradas corretamente
- [ ] Deploy iniciado sem erros
- [ ] Todos os containers iniciaram (frontend, backend, postgres, backup)
- [ ] Healthchecks passando (verde no Portainer)

### Após o Deploy
- [ ] Migration do banco executada com sucesso
- [ ] Site acessível via HTTPS: https://ergonomia.helthcorp.com.br
- [ ] Certificado SSL válido (cadeado verde no navegador)
- [ ] Login funciona com credenciais padrão
- [ ] Senha do admin alterada
- [ ] Usuário admin criado com seus dados
- [ ] Usuário padrão desabilitado/removido

## 🔍 Verificações Pós-Deploy

### 1. Testar Acesso HTTPS
```bash
curl -I https://ergonomia.helthcorp.com.br
# Deve retornar: HTTP/2 200
```

### 2. Verificar Redirecionamento HTTP → HTTPS
```bash
curl -I http://ergonomia.helthcorp.com.br
# Deve retornar: HTTP/1.1 301 ou 302 (redirect)
```

### 3. Testar API
```bash
curl https://ergonomia.helthcorp.com.br/api/health
# Deve retornar: {"status":"ok"}
```

### 4. Verificar Logs (sem erros críticos)
```bash
docker logs ergonomia-backend --tail 50
docker logs ergonomia-frontend --tail 50
docker logs ergonomia-postgres --tail 50
```

### 5. Verificar Backup Automático
```bash
docker logs ergonomia-backup --tail 20
# Deve mostrar agendamento dos backups
```

### 6. Testar Banco de Dados
```bash
docker exec ergonomia-postgres pg_isready -U ergonomia_user
# Deve retornar: accepting connections
```

## 🎯 Funcionalidades a Testar

Após login no sistema:

- [ ] Dashboard carrega corretamente
- [ ] Pode criar empresa
- [ ] Pode criar unidade
- [ ] Pode criar setor
- [ ] Pode criar usuário
- [ ] Pode iniciar avaliação
- [ ] Gráficos aparecem
- [ ] Relatórios funcionam

## 🚨 Rollback (se necessário)

Se algo der errado:

```bash
# Via Portainer
# Stacks → ergonomia → Stop stack → Remove stack

# Via SSH
cd /opt/apps/ergonomia
docker compose down
docker volume rm ergonomia_postgres-data  # CUIDADO: Remove dados!
```

## 📞 Contatos de Emergência

- **Suporte Docker:** https://docs.docker.com
- **Suporte Traefik:** https://doc.traefik.io
- **Suporte Portainer:** https://docs.portainer.io
- **Issues do Projeto:** https://github.com/daniellinsr/ergonomia/issues

## 📝 Notas Importantes

1. **Backup:** Sempre faça backup antes de fazer alterações
2. **Senhas:** Nunca commite senhas no Git
3. **Logs:** Monitore os logs nas primeiras 24h após deploy
4. **Performance:** Monitore uso de CPU e memória
5. **SSL:** Certificado renova automaticamente via Let's Encrypt

---

**Preparado para o deploy?** ✅

Se todos os itens acima estão marcados, você está pronto para fazer o deploy!

Siga: [DEPLOY-RAPIDO.md](DEPLOY-RAPIDO.md) ou [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md)
