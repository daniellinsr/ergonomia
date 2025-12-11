#!/bin/bash

# Script para verificar constraints e índices das tabelas

echo "=== Verificação: Constraints e Índices ==="
echo ""

CONTAINER_ID="b3d631065cb9"

echo "📦 Container: $CONTAINER_ID"
echo ""

echo "1. Verificando Foreign Keys (chaves estrangeiras):"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << 'EOF'
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN (
    'avaliacoes_ergonomicas',
    'setores',
    'unidades',
    'perigos_identificados',
    'classificacao_risco'
  )
ORDER BY tc.table_name, kcu.column_name;
EOF

echo ""
echo "2. Verificando índices nas tabelas principais:"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << 'EOF'
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN (
  'avaliacoes_ergonomicas',
  'setores',
  'unidades',
  'empresas',
  'perigos_identificados',
  'classificacao_risco'
)
ORDER BY tablename, indexname;
EOF

echo ""
echo "3. Verificando constraints UNIQUE e CHECK:"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << 'EOF'
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints AS tc
LEFT JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type IN ('UNIQUE', 'CHECK')
  AND tc.table_name IN (
    'avaliacoes_ergonomicas',
    'setores',
    'unidades',
    'empresas'
  )
ORDER BY tc.table_name, tc.constraint_type;
EOF

echo ""
echo "4. Verificando se há CASCADE nas foreign keys importantes:"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << 'EOF'
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS referencias_tabela,
  CASE
    WHEN rc.delete_rule = 'CASCADE' THEN '✓ CASCADE'
    WHEN rc.delete_rule = 'SET NULL' THEN '⚠ SET NULL'
    WHEN rc.delete_rule = 'RESTRICT' THEN '✗ RESTRICT'
    WHEN rc.delete_rule = 'NO ACTION' THEN '✗ NO ACTION'
    ELSE rc.delete_rule
  END as on_delete,
  CASE
    WHEN rc.update_rule = 'CASCADE' THEN '✓ CASCADE'
    WHEN rc.update_rule = 'SET NULL' THEN '⚠ SET NULL'
    WHEN rc.update_rule = 'RESTRICT' THEN '✗ RESTRICT'
    WHEN rc.update_rule = 'NO ACTION' THEN '✗ NO ACTION'
    ELSE rc.update_rule
  END as on_update
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN (
    'avaliacoes_ergonomicas',
    'setores',
    'unidades'
  )
ORDER BY tc.table_name;
EOF

echo ""
echo "5. Verificando estrutura da tabela avaliacoes_ergonomicas:"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << 'EOF'
\d avaliacoes_ergonomicas
EOF

echo ""
echo "6. Verificando estrutura da tabela setores:"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << 'EOF'
\d setores
EOF

echo ""
echo "7. Verificando estrutura da tabela unidades:"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << 'EOF'
\d unidades
EOF

echo ""
echo "=== Verificação Concluída ==="
echo ""
echo "Análise:"
echo "- Se não houver CASCADE em empresa_id, isso pode causar inconsistências"
echo "- Índices faltantes podem afetar performance, mas não causam perda de referências"
echo "- A causa mais provável é a ausência de ON UPDATE CASCADE ou ON DELETE CASCADE"
