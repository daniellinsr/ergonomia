-- Migration 013: Corrigir categoria do perigo 61

-- Problema: Perigo 61 estava na categoria errada
-- "Trabalho em condições de difícil comunicação" pertence a "Organização/Cognitivo/Psicossocial"
-- mas estava em "Condições Físicas/Ambientais"

UPDATE perigos_catalogo
SET categoria = 'Organização/Cognitivo/Psicossocial'
WHERE numero = 61
  AND descricao = 'Trabalho em condições de difícil comunicação';

-- Verificar se a atualização foi aplicada
DO $$
DECLARE
    categoria_atual VARCHAR;
BEGIN
    SELECT categoria INTO categoria_atual
    FROM perigos_catalogo
    WHERE numero = 61;

    IF categoria_atual = 'Organização/Cognitivo/Psicossocial' THEN
        RAISE NOTICE '✅ Perigo 61 corrigido com sucesso! Categoria: %', categoria_atual;
    ELSE
        RAISE WARNING '⚠️  Perigo 61 ainda está na categoria: %', categoria_atual;
    END IF;
END $$;

COMMENT ON TABLE perigos_catalogo IS 'Catálogo de perigos ergonômicos - Atualizado em migration 013 (correção perigo 61)';
