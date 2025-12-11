#!/bin/bash

# Script para diagnosticar o problema de empresa_id nas avaliações via Docker Swarm

echo "=== Diagnóstico: Empresa ID das Avaliações (via Docker Swarm) ==="
echo ""

echo "1. Verificando empresas cadastradas:"
docker exec $(docker ps -q -f name=ergonomia_postgres) psql -U postgres ergonomia_db -c "
SELECT id, nome_fantasia, razao_social, cnpj
FROM empresas
ORDER BY created_at;
"

echo ""
echo "2. Verificando empresa_id do usuário logado (341df671-aaad-445d-805f-af345bf8af41):"
docker exec $(docker ps -q -f name=ergonomia_postgres) psql -U postgres ergonomia_db -c "
SELECT u.id, u.nome, u.email, u.empresa_id, e.nome_fantasia
FROM usuarios u
LEFT JOIN empresas e ON u.empresa_id = e.id
WHERE u.empresa_id = '341df671-aaad-445d-805f-af345bf8af41';
"

echo ""
echo "3. Verificando distribuição de avaliações por empresa_id:"
docker exec $(docker ps -q -f name=ergonomia_postgres) psql -U postgres ergonomia_db -c "
SELECT
  a.empresa_id,
  e.nome_fantasia,
  COUNT(a.id) as total_avaliacoes,
  MIN(a.data_avaliacao) as primeira_avaliacao,
  MAX(a.data_avaliacao) as ultima_avaliacao
FROM avaliacoes_ergonomicas a
LEFT JOIN empresas e ON a.empresa_id = e.id
GROUP BY a.empresa_id, e.nome_fantasia
ORDER BY total_avaliacoes DESC;
"

echo ""
echo "4. Verificando todas as avaliações (primeiras 10):"
docker exec $(docker ps -q -f name=ergonomia_postgres) psql -U postgres ergonomia_db -c "
SELECT
  a.id,
  SUBSTRING(a.titulo, 1, 40) as titulo,
  a.empresa_id,
  e.nome_fantasia,
  a.data_avaliacao,
  a.status
FROM avaliacoes_ergonomicas a
LEFT JOIN empresas e ON a.empresa_id = e.id
ORDER BY a.data_avaliacao DESC
LIMIT 10;
"

echo ""
echo "5. Verificando se há avaliações com empresa_id NULL ou inválido:"
docker exec $(docker ps -q -f name=ergonomia_postgres) psql -U postgres ergonomia_db -c "
SELECT COUNT(*) as total_sem_empresa
FROM avaliacoes_ergonomicas
WHERE empresa_id IS NULL OR empresa_id NOT IN (SELECT id FROM empresas);
"

echo ""
echo "6. Resumo rápido:"
docker exec $(docker ps -q -f name=ergonomia_postgres) psql -U postgres ergonomia_db -c "
SELECT
  'Total Empresas' as metrica,
  COUNT(*)::text as valor
FROM empresas
UNION ALL
SELECT
  'Total Usuários' as metrica,
  COUNT(*)::text as valor
FROM usuarios
UNION ALL
SELECT
  'Total Avaliações' as metrica,
  COUNT(*)::text as valor
FROM avaliacoes_ergonomicas;
"

echo ""
echo "=== Diagnóstico Concluído ==="
