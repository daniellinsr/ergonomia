-- Migration 013: Remover duplicação do perigo 61

-- Problema: Perigo "Trabalho em condições de difícil comunicação" estava duplicado
-- - Item 37: Correto, na categoria "Organização/Cognitivo/Psicossocial"
-- - Item 61: Duplicado incorretamente em "Condições Físicas/Ambientais"

-- Solução: Remover item 61 (duplicado)
-- O catálogo passa de 61 para 60 perigos (sem duplicação)

DELETE FROM perigos_catalogo
WHERE numero = 61
  AND descricao = 'Trabalho em condições de difícil comunicação'
  AND categoria = 'Condições Físicas/Ambientais';

-- Verificar remoção
DO $$
DECLARE
    total_perigos INTEGER;
    perigo_37_existe BOOLEAN;
    perigo_61_existe BOOLEAN;
BEGIN
    -- Contar total de perigos
    SELECT COUNT(*) INTO total_perigos FROM perigos_catalogo;

    -- Verificar se perigo 37 existe (deve existir)
    SELECT EXISTS(
        SELECT 1 FROM perigos_catalogo
        WHERE numero = 37
        AND descricao = 'Trabalho em condições de difícil comunicação'
    ) INTO perigo_37_existe;

    -- Verificar se perigo 61 foi removido (não deve existir)
    SELECT EXISTS(
        SELECT 1 FROM perigos_catalogo WHERE numero = 61
    ) INTO perigo_61_existe;

    -- Reportar resultado
    RAISE NOTICE '📊 Total de perigos no catálogo: %', total_perigos;

    IF perigo_37_existe THEN
        RAISE NOTICE '✅ Perigo 37 (Trabalho em condições de difícil comunicação) mantido na categoria correta';
    ELSE
        RAISE WARNING '⚠️  Perigo 37 não encontrado!';
    END IF;

    IF NOT perigo_61_existe THEN
        RAISE NOTICE '✅ Perigo 61 duplicado removido com sucesso';
    ELSE
        RAISE WARNING '⚠️  Perigo 61 ainda existe no catálogo';
    END IF;

    IF total_perigos = 60 THEN
        RAISE NOTICE '✅ Catálogo agora tem 60 perigos (numeração sequencial de 1 a 60)';
    ELSE
        RAISE WARNING '⚠️  Total esperado: 60 perigos. Total atual: %', total_perigos;
    END IF;
END $$;

COMMENT ON TABLE perigos_catalogo IS 'Catálogo de perigos ergonômicos - Atualizado em migration 013 (removida duplicação do item 61)';
