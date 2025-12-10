-- Migration 014: Renumerar perigos para sequência 1-60

-- Problema: Banco de dados tem perigos com numeração 1-61 (com item 61 duplicado)
-- Solução: Reorganizar numeração sequencial de 1-60, removendo duplicação

-- Passo 1: Criar tabela temporária com numeração correta
CREATE TEMP TABLE perigos_temp AS
SELECT
    ROW_NUMBER() OVER (ORDER BY numero) as novo_numero,
    id,
    numero as numero_antigo,
    categoria,
    descricao
FROM perigos_catalogo
WHERE NOT (
    numero = 61
    AND descricao = 'Trabalho em condições de difícil comunicação'
    AND categoria = 'Condições Físicas/Ambientais'
)
ORDER BY numero;

-- Passo 2: Desabilitar constraint temporariamente se houver
ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_numero_key;

-- Passo 3: Atualizar números baseado na tabela temporária
UPDATE perigos_catalogo pc
SET numero = pt.novo_numero
FROM perigos_temp pt
WHERE pc.id = pt.id;

-- Passo 4: Remover perigo 61 duplicado (se ainda existir)
DELETE FROM perigos_catalogo
WHERE numero > 60
   OR (numero = 61
       AND descricao = 'Trabalho em condições de difícil comunicação'
       AND categoria = 'Condições Físicas/Ambientais');

-- Passo 5: Recriar constraint de unicidade
ALTER TABLE perigos_catalogo ADD CONSTRAINT perigos_catalogo_numero_key UNIQUE (numero);

-- Verificação
DO $$
DECLARE
    total_perigos INTEGER;
    numero_min INTEGER;
    numero_max INTEGER;
    tem_gaps BOOLEAN;
    duplicados INTEGER;
BEGIN
    -- Estatísticas
    SELECT COUNT(*), MIN(numero), MAX(numero)
    INTO total_perigos, numero_min, numero_max
    FROM perigos_catalogo;

    -- Verificar gaps na numeração
    SELECT EXISTS(
        SELECT 1
        FROM generate_series(1, 60) AS s(num)
        WHERE NOT EXISTS (
            SELECT 1 FROM perigos_catalogo WHERE numero = s.num
        )
    ) INTO tem_gaps;

    -- Verificar duplicados
    SELECT COUNT(*) INTO duplicados
    FROM (
        SELECT numero, COUNT(*) as cnt
        FROM perigos_catalogo
        GROUP BY numero
        HAVING COUNT(*) > 1
    ) dup;

    -- Reportar
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '  Renumeração de Perigos - Resultado';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Total de perigos: %', total_perigos;
    RAISE NOTICE '🔢 Numeração: % até %', numero_min, numero_max;

    IF total_perigos = 60 THEN
        RAISE NOTICE '✅ Total correto: 60 perigos';
    ELSE
        RAISE WARNING '⚠️  Total esperado: 60, atual: %', total_perigos;
    END IF;

    IF numero_min = 1 AND numero_max = 60 THEN
        RAISE NOTICE '✅ Faixa correta: 1 a 60';
    ELSE
        RAISE WARNING '⚠️  Faixa esperada: 1-60, atual: %--%', numero_min, numero_max;
    END IF;

    IF NOT tem_gaps THEN
        RAISE NOTICE '✅ Sem gaps na numeração';
    ELSE
        RAISE WARNING '⚠️  Existem gaps na numeração';
    END IF;

    IF duplicados = 0 THEN
        RAISE NOTICE '✅ Sem duplicados';
    ELSE
        RAISE WARNING '⚠️  % números duplicados encontrados', duplicados;
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════';

    -- Mostrar distribuição por categoria
    RAISE NOTICE '';
    RAISE NOTICE '📋 Distribuição por categoria:';
    FOR categoria_info IN
        SELECT categoria,
               COUNT(*) as total,
               MIN(numero) as primeiro,
               MAX(numero) as ultimo
        FROM perigos_catalogo
        GROUP BY categoria
        ORDER BY MIN(numero)
    LOOP
        RAISE NOTICE '  % → % perigos (%--%)',
            categoria_info.categoria,
            categoria_info.total,
            categoria_info.primeiro,
            categoria_info.ultimo;
    END LOOP;
END $$;

COMMENT ON TABLE perigos_catalogo IS 'Catálogo de perigos ergonômicos - Renumerado sequencialmente 1-60 (migration 014)';
