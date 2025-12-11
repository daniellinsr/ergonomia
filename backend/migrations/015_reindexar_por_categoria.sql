-- Migration 015: Reindexar perigos por categoria (numeração independente por categoria)

-- Cada categoria terá sua própria numeração começando do 1
-- Biomecânicos: 1-16
-- Mobiliário/Equipamentos: 1-17
-- Organização/Cognitivo/Psicossocial: 1-19
-- Condições Físicas/Ambientais: 1-9

BEGIN;

RAISE NOTICE '';
RAISE NOTICE '═══════════════════════════════════════';
RAISE NOTICE '  Reindexação por Categoria';
RAISE NOTICE '═══════════════════════════════════════';
RAISE NOTICE '';

-- Criar tabela temporária com nova numeração por categoria
CREATE TEMP TABLE perigos_numeracao_categoria AS
SELECT
    id,
    numero as numero_antigo,
    categoria,
    descricao,
    ROW_NUMBER() OVER (
        PARTITION BY categoria
        ORDER BY numero
    ) as novo_numero
FROM perigos_catalogo;

-- Mostrar nova numeração por categoria
RAISE NOTICE 'Nova distribuição:';
RAISE NOTICE '';

DO $$
DECLARE
    cat_record RECORD;
BEGIN
    FOR cat_record IN
        SELECT
            categoria,
            COUNT(*) as total,
            MIN(novo_numero) as min_num,
            MAX(novo_numero) as max_num
        FROM perigos_numeracao_categoria
        GROUP BY categoria
        ORDER BY
            CASE categoria
                WHEN 'Biomecânicos' THEN 1
                WHEN 'Mobiliário/Equipamentos' THEN 2
                WHEN 'Organização/Cognitivo/Psicossocial' THEN 3
                WHEN 'Condições Físicas/Ambientais' THEN 4
                ELSE 5
            END
    LOOP
        RAISE NOTICE '% → % perigos (%--%)',
            cat_record.categoria,
            cat_record.total,
            cat_record.min_num,
            cat_record.max_num;
    END LOOP;
END $$;

-- Desabilitar constraint
ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_numero_key;

-- Mover todos para números negativos temporariamente
UPDATE perigos_catalogo SET numero = -id;

-- Aplicar nova numeração
UPDATE perigos_catalogo pc
SET numero = pnc.novo_numero
FROM perigos_numeracao_categoria pnc
WHERE pc.id = pnc.id;

-- Não recriar constraint de unicidade no número (agora número é único apenas dentro da categoria)
-- Criar constraint composta (categoria + numero)
ALTER TABLE perigos_catalogo
    ADD CONSTRAINT perigos_catalogo_categoria_numero_key UNIQUE (categoria, numero);

RAISE NOTICE '';
RAISE NOTICE '✅ Reindexação por categoria concluída!';
RAISE NOTICE '';

COMMIT;

COMMENT ON TABLE perigos_catalogo IS 'Catálogo de perigos ergonômicos - Numeração por categoria (migration 015)';
