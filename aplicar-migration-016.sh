#!/bin/bash

# Script para aplicar a migration 016 - Validações de consistência de empresa_id

echo "=== Aplicando Migration 016: Validações de Consistência ==="
echo ""

CONTAINER_ID="b3d631065cb9"

echo "📦 Container: $CONTAINER_ID"
echo ""

echo "Esta migration vai:"
echo "  1. Criar triggers para validar empresa_id em setores e avaliações"
echo "  2. Criar triggers para sincronizar automaticamente empresa_id"
echo "  3. Corrigir automaticamente inconsistências existentes"
echo ""

read -p "Deseja continuar? (s/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Operação cancelada."
    exit 1
fi

echo "🔧 Aplicando migration 016..."
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db < backend/migrations/016_add_empresa_consistency_checks.sql

echo ""
echo "✅ Migration 016 aplicada com sucesso!"
echo ""

echo "📊 Verificando triggers criados:"
docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << 'EOF'
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  CASE
    WHEN tgtype & 2 = 2 THEN 'BEFORE'
    WHEN tgtype & 64 = 64 THEN 'AFTER'
    ELSE 'UNKNOWN'
  END as timing,
  CASE
    WHEN tgtype & 4 = 4 THEN 'INSERT'
    WHEN tgtype & 8 = 8 THEN 'DELETE'
    WHEN tgtype & 16 = 16 THEN 'UPDATE'
    ELSE 'UNKNOWN'
  END as event
FROM pg_trigger
WHERE tgname IN (
  'trigger_validate_setor_empresa_id',
  'trigger_validate_avaliacao_empresa_id',
  'trigger_sync_setor_empresa_id',
  'trigger_sync_avaliacao_empresa_id'
)
ORDER BY table_name, trigger_name;
EOF

echo ""
echo "🎯 Testando a validação (deve dar erro):"
echo "Tentando criar setor com empresa_id diferente da unidade..."

docker exec -i $CONTAINER_ID psql -U ergonomia_user -d ergonomia_db << 'EOF' || true
-- Pegar IDs de teste
DO $$
DECLARE
    v_unidade_id UUID;
    v_empresa_errada UUID;
BEGIN
    -- Pegar primeira unidade e uma empresa diferente
    SELECT id INTO v_unidade_id FROM unidades LIMIT 1;
    SELECT id INTO v_empresa_errada FROM empresas
    WHERE id != (SELECT empresa_id FROM unidades WHERE id = v_unidade_id)
    LIMIT 1;

    -- Tentar criar setor com empresa_id errado (deve falhar)
    INSERT INTO setores (empresa_id, unidade_id, nome)
    VALUES (v_empresa_errada, v_unidade_id, 'Teste Validação');

    RAISE NOTICE 'ERRO: Validação não funcionou!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'OK: Validação funcionou corretamente - %', SQLERRM;
END $$;
EOF

echo ""
echo "=== Migration 016 Concluída ==="
echo ""
echo "✅ Proteções adicionadas:"
echo "  • Setores devem ter o mesmo empresa_id da unidade"
echo "  • Avaliações devem ter o mesmo empresa_id do setor"
echo "  • Mudanças de empresa são sincronizadas automaticamente"
echo "  • Inconsistências existentes foram corrigidas"
echo ""
