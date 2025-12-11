#!/bin/bash

# Script para deploy do backend com logs de debug para relatório

set -e

echo "=== Deploy: Backend com Logs de Debug para Relatório ==="
echo ""

# Construir imagem do backend
echo "1. Construindo nova imagem do backend..."
docker build -t ergonomia-backend:latest ./backend

# Tag da imagem
echo "2. Criando tag da imagem..."
docker tag ergonomia-backend:latest ergonomia-backend:relatorio-debug

# Atualizar serviço no swarm
echo "3. Atualizando serviço backend no Docker Swarm..."
docker service update --image ergonomia-backend:latest ergonomia_backend --force

echo ""
echo "=== Deploy concluído com sucesso! ==="
echo ""
echo "Verificando status do serviço..."
docker service ps ergonomia_backend --filter "desired-state=running" | head -n 5

echo ""
echo "Logs adicionados:"
echo "  ✓ Empresa ID sendo usada"
echo "  ✓ Filtros aplicados"
echo "  ✓ Total de avaliações encontradas"
echo "  ✓ Estatísticas geradas"
echo "  ✓ Mensagens de erro detalhadas"
echo ""
echo "Para ver os logs, use:"
echo "  docker service logs -f ergonomia_backend"
echo ""
echo "Aguarde alguns instantes e acesse o Relatório de Avaliações no sistema..."
