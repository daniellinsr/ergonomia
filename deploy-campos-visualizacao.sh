#!/bin/bash

# Script para deploy das alterações nos campos de visualização
# Adiciona exibição de Descrição e Observações na tela de visualização de avaliação

set -e

echo "=== Deploy: Campos de Visualização de Avaliação ==="
echo ""

# Construir imagem do frontend
echo "1. Construindo nova imagem do frontend..."
docker build -t ergonomia-frontend:latest ./frontend

# Tag da imagem
echo "2. Criando tag da imagem..."
docker tag ergonomia-frontend:latest ergonomia-frontend:campos-visualizacao

# Atualizar serviço no swarm
echo "3. Atualizando serviço frontend no Docker Swarm..."
docker service update --image ergonomia-frontend:latest ergonomia_frontend --force

echo ""
echo "=== Deploy concluído com sucesso! ==="
echo ""
echo "Verificando status do serviço..."
docker service ps ergonomia_frontend --filter "desired-state=running" | head -n 5

echo ""
echo "Alterações implementadas:"
echo "  ✓ Campo 'Descrição' exibido em caixa azul"
echo "  ✓ Campo 'Observações sobre o risco/ferramenta utilizada/resultados' exibido em caixa amarela"
echo "  ✓ Campos exibidos apenas quando possuem conteúdo"
echo "  ✓ Formatação com quebras de linha preservadas"
echo ""
echo "A aplicação estará disponível em alguns instantes..."
