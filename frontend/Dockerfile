# Dockerfile para Frontend - Sistema de Gestão Ergonômica
# React + Vite servido via Nginx

# Estágio 1: Build da aplicação React
FROM node:20-alpine AS builder

# Informações do mantenedor
LABEL maintainer="daniel.rodriguez@helthcorp.com.br"
LABEL description="Frontend - Sistema de Gestão Ergonômica"

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci && npm cache clean --force

# Copiar código fonte
COPY . .

# Criar build de produção
RUN npm run build

# Estágio 2: Servir com Nginx
FROM nginx:1.25-alpine

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remover o site padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar build do estágio anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Criar usuário nginx se não existir e ajustar permissões
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Expor porta 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Nginx roda em foreground por padrão no container
CMD ["nginx", "-g", "daemon off;"]
