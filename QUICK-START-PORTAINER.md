# Guia Rápido - Deploy com Portainer

Deploy em **10 passos simples**!

## Passo 1: Instalar Docker no servidor

```bash
ssh root@SEU_IP_DA_VPS

# Script de instalação rápida do Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

## Passo 2: Instalar Portainer

```bash
docker volume create portainer_data

docker run -d \
  -p 9000:9000 \
  -p 9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Acesse: `http://SEU_IP:9000` e crie senha de admin.

## Passo 3: Configurar DNS

No Registro.br:
- Tipo: **A**
- Nome: `ergonomia`
- Valor: `SEU_IP_DA_VPS`

## Passo 4: Clonar repositório no servidor

```bash
ssh root@SEU_IP_DA_VPS

# Instalar Git
apt install -y git

# Clonar repositório
cd /root
git clone https://github.com/daniellinsr/ergonomia.git
cd ergonomia
```

## Passo 5: Configurar .env

```bash
# Copiar template
cp .env.docker.example .env

# Gerar chaves JWT
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copiar a chave gerada

node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copiar esta segunda chave também

# Editar .env
nano .env
```

Preencha com suas credenciais e cole as chaves JWT geradas:

```env
DB_PASSWORD=SuaSenhaForte123!
JWT_SECRET=cole_primeira_chave_aqui
JWT_REFRESH_SECRET=cole_segunda_chave_aqui
FRONTEND_URL=https://ergonomia.helthcorp.com.br
```

Salve (Ctrl+O, Enter, Ctrl+X)

## Passo 6: Criar Stack no Portainer

1. Portainer → **Stacks** → **+ Add stack**
2. Nome: `ergonomia`
3. **Upload**: selecione `docker-compose.yml`
4. **Load variables from .env file**: upload `.env`
5. **Deploy the stack**

Aguarde 5-10 minutos para build.

## Passo 7: Executar Migrations

No Portainer:
1. **Containers** → `ergonomia-postgres`
2. **Console** → `/bin/sh` → **Connect**

```bash
psql -U ergonomia_user -d ergonomia_db -f /docker-entrypoint-initdb.d/001_initial_schema.sql
psql -U ergonomia_user -d ergonomia_db -f /docker-entrypoint-initdb.d/002_planos_acao.sql
psql -U ergonomia_user -d ergonomia_db -f /docker-entrypoint-initdb.d/003_remover_trabalhadores.sql
```

## Passo 8: Instalar Nginx Proxy Manager

Portainer → **Stacks** → **+ Add stack**

Nome: `nginx-proxy-manager`

```yaml
version: '3.8'
services:
  nginx-proxy-manager:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    volumes:
      - nginx-data:/data
      - nginx-letsencrypt:/etc/letsencrypt
    networks:
      - ergonomia_ergonomia-network

volumes:
  nginx-data:
  nginx-letsencrypt:

networks:
  ergonomia_ergonomia-network:
    external: true
```

**Deploy**

## Passo 9: Configurar SSL

1. Acesse: `http://SEU_IP:81`
2. Login: `admin@example.com` / `changeme`
3. **ALTERE A SENHA!**
4. **Hosts** → **Proxy Hosts** → **Add Proxy Host**
   - Domain: `ergonomia.helthcorp.com.br`
   - Forward to: `ergonomia-frontend:80`
   - ✅ Block Common Exploits
   - ✅ Websockets Support
5. Aba **SSL**:
   - ✅ Request a new SSL Certificate
   - ✅ Force SSL
   - ✅ HTTP/2 Support
   - Email: seu-email@helthcorp.com.br
   - ✅ I Agree
6. **Save**

## Passo 10: Testar

Abra: `https://ergonomia.helthcorp.com.br`

## Passo 11: Monitorar

Portainer → **Containers** → ver status e logs

---

## Atualizar aplicação

```bash
cd /root/ergonomia
git pull  # ou envie novos arquivos via SCP

# No Portainer
# Stacks → ergonomia → Update stack → Re-pull and redeploy
```

---

## Comandos úteis

```bash
# Ver containers
docker ps

# Logs
docker logs ergonomia-backend -f
docker logs ergonomia-frontend -f

# Reiniciar
docker restart ergonomia-backend

# Backup manual
docker exec ergonomia-postgres pg_dump -U ergonomia_user ergonomia_db | gzip > backup.sql.gz
```

---

**Pronto! Sistema em produção! 🚀**

URLs importantes:
- **App**: https://ergonomia.helthcorp.com.br
- **Portainer**: http://SEU_IP:9000
- **Nginx Proxy Manager**: http://SEU_IP:81
