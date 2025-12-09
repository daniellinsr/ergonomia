# 🔧 Referência de Configuração do Traefik

Este documento mostra a configuração mínima do Traefik necessária para o sistema funcionar.

## ⚠️ Importante

**Você NÃO precisa alterar sua configuração atual do Traefik!**

Este documento é apenas uma referência para você confirmar que seu Traefik tem as configurações mínimas necessárias.

## 📋 Requisitos Mínimos do Traefik

O sistema de ergonomia requer que seu Traefik tenha:

1. ✅ **Entrypoints:** `web` (HTTP:80) e `websecure` (HTTPS:443)
2. ✅ **Certresolver:** `lets-encrypt` (ou similar)
3. ✅ **Rede:** `web` (externa)
4. ✅ **Docker provider:** Habilitado

## 🔍 Verificar Configuração Atual

### Via arquivo traefik.toml

Seu arquivo `/docker/traefik/traefik.toml` deve ter algo similar a:

```toml
[global]
  checkNewVersion = true
  sendAnonymousUsage = false

[log]
  level = "INFO"

[api]
  dashboard = true
  insecure = false

# Docker Provider
[providers.docker]
  endpoint = "unix:///var/run/docker.sock"
  exposedByDefault = false
  network = "web"

# Entrypoints
[entryPoints]
  [entryPoints.web]
    address = ":80"
    # Redirecionar HTTP para HTTPS (opcional mas recomendado)
    [entryPoints.web.http.redirections.entryPoint]
      to = "websecure"
      scheme = "https"

  [entryPoints.websecure]
    address = ":443"

# Let's Encrypt
[certificatesResolvers.lets-encrypt.acme]
  email = "seu-email@helthcorp.com.br"
  storage = "/acme.json"
  [certificatesResolvers.lets-encrypt.acme.httpChallenge]
    entryPoint = "web"
```

### Via arquivo traefik.yml

Ou em formato YAML:

```yaml
global:
  checkNewVersion: true
  sendAnonymousUsage: false

log:
  level: INFO

api:
  dashboard: true
  insecure: false

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: web

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https

  websecure:
    address: ":443"

certificatesResolvers:
  lets-encrypt:
    acme:
      email: seu-email@helthcorp.com.br
      storage: /acme.json
      httpChallenge:
        entryPoint: web
```

## 🌐 Configuração da Rede

### Verificar se a rede 'web' existe

```bash
docker network ls | grep web
```

Se não existir, criar:

```bash
docker network create web
```

### Verificar containers na rede

```bash
docker network inspect web
```

Deve mostrar pelo menos o Traefik e o Portainer conectados.

## 📝 Labels do Docker Compose

O `docker-compose.yml` do sistema de ergonomia já tem as labels corretas:

```yaml
labels:
  # Habilitar Traefik
  - "traefik.enable=true"
  - "traefik.docker.network=web"

  # Roteador HTTPS
  - "traefik.http.routers.ergonomia.rule=Host(`ergonomia.helthcorp.com.br`)"
  - "traefik.http.routers.ergonomia.entrypoints=websecure"
  - "traefik.http.routers.ergonomia.tls=true"
  - "traefik.http.routers.ergonomia.tls.certresolver=lets-encrypt"

  # Service
  - "traefik.http.services.ergonomia.loadbalancer.server.port=80"

  # Roteador HTTP (redireciona para HTTPS)
  - "traefik.http.routers.ergonomia-http.rule=Host(`ergonomia.helthcorp.com.br`)"
  - "traefik.http.routers.ergonomia-http.entrypoints=web"
```

## 🔍 Comandos de Verificação

### 1. Verificar Traefik está rodando

```bash
docker ps | grep traefik
```

**Saída esperada:**
```
CONTAINER ID   IMAGE            COMMAND        CREATED       STATUS       PORTS
abc123def456   traefik:latest   "/traefik"     2 days ago    Up 2 days    0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### 2. Verificar logs do Traefik

```bash
docker logs traefik --tail 50
```

Não deve ter erros críticos.

### 3. Verificar roteadores registrados

```bash
docker logs traefik | grep "Router.*registered"
```

Após deploy, deve aparecer:
```
Router ergonomia@docker registered
Router ergonomia-http@docker registered
```

### 4. Verificar certificados SSL

```bash
docker exec traefik cat /acme.json | grep ergonomia
```

Após primeiro acesso, deve mostrar certificado obtido.

## 🎯 Exemplo Completo (Referência)

### docker-compose.yml do Traefik (seu setup atual)

```yaml
services:
  traefik:
    image: traefik:latest
    container_name: traefik
    restart: always
    networks:
      - web
    ports:
      - 80:80
      - 443:443
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /docker/traefik/traefik.toml:/traefik.toml
      - /docker/traefik/acme.json:/acme.json
    logging:
      options:
        max-size: "10m"
        max-file: "3"

networks:
  web:
    external: true
```

### Como o Sistema de Ergonomia se conecta

```yaml
services:
  frontend:
    # ... outras configurações ...
    networks:
      - ergonomia-network  # Rede interna
      - web                # Rede do Traefik (externa)
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=web"
      - "traefik.http.routers.ergonomia.rule=Host(`ergonomia.helthcorp.com.br`)"
      - "traefik.http.routers.ergonomia.entrypoints=websecure"
      - "traefik.http.routers.ergonomia.tls.certresolver=lets-encrypt"

networks:
  ergonomia-network:
    driver: bridge
  web:
    external: true  # Usa a rede do Traefik
```

## 🔧 Ajustes (se necessário)

### Se usar nome diferente para certresolver

Se seu Traefik usa `letsencrypt` ao invés de `lets-encrypt`:

**No arquivo .env:**
```env
TRAEFIK_CERTRESOLVER=letsencrypt
```

**No docker-compose.yml, alterar:**
```yaml
- "traefik.http.routers.ergonomia.tls.certresolver=letsencrypt"
```

### Se usar entrypoints com nomes diferentes

Se seu Traefik usa `http` e `https` ao invés de `web` e `websecure`:

**No docker-compose.yml, alterar:**
```yaml
- "traefik.http.routers.ergonomia.entrypoints=https"
- "traefik.http.routers.ergonomia-http.entrypoints=http"
```

## 📊 Monitoramento

### Dashboard do Traefik

Se habilitado, acesse:
```
https://traefik.helthcorp.com.br/dashboard/
```

Lá você pode ver:
- ✅ Roteadores ativos
- ✅ Serviços registrados
- ✅ Middlewares
- ✅ Certificados SSL

### Ver configuração em tempo real

```bash
docker exec traefik traefik version
```

## 🚨 Troubleshooting

### Problema: Container não aparece no Traefik

**Verificar:**
1. Container está na rede `web`?
   ```bash
   docker inspect ergonomia-frontend | grep -A 10 Networks
   ```

2. Labels estão corretas?
   ```bash
   docker inspect ergonomia-frontend | grep -A 30 Labels
   ```

3. Traefik está monitorando o Docker?
   ```bash
   docker logs traefik | grep docker
   ```

### Problema: SSL não funciona

**Verificar:**
1. Porta 80 está acessível externamente?
   ```bash
   curl -I http://seu-servidor.com.br
   ```

2. Domínio aponta para o servidor?
   ```bash
   nslookup ergonomia.helthcorp.com.br
   ```

3. Arquivo acme.json tem permissão correta?
   ```bash
   ls -la /docker/traefik/acme.json
   # Deve ser: -rw------- (600)
   ```

4. Logs do Traefik mostram erro?
   ```bash
   docker logs traefik | grep -i error
   ```

### Problema: Redirect HTTP → HTTPS não funciona

**Adicionar middleware no docker-compose.yml:**
```yaml
labels:
  # ... labels existentes ...
  - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
  - "traefik.http.routers.ergonomia-http.middlewares=redirect-to-https"
```

## 📚 Recursos Adicionais

- **Documentação Traefik:** https://doc.traefik.io/traefik/
- **Docker Provider:** https://doc.traefik.io/traefik/providers/docker/
- **Let's Encrypt:** https://doc.traefik.io/traefik/https/acme/
- **Exemplos:** https://github.com/traefik/traefik/tree/master/docs/content/user-guides

## ✅ Validação Final

Antes do deploy, confirme que:

- [ ] Traefik está rodando
- [ ] Rede `web` existe
- [ ] Portas 80 e 443 estão abertas
- [ ] Certresolver está configurado
- [ ] Docker provider está habilitado
- [ ] Seu Portainer já funciona com Traefik

Se tudo acima está OK, seu Traefik está pronto para rotear o sistema de ergonomia! 🎉

---

**Dúvidas sobre configuração?**

Consulte: [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md) para instruções completas.
