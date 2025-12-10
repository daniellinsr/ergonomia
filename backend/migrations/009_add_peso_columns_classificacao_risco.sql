-- Migration 009: Reestruturar tabela classificacao_risco
-- Adiciona campos descritivos para classificação de risco ergonômico conforme NR-17

-- Primeiro, vamos remover as constraints antigas de severidade e probabilidade
ALTER TABLE classificacao_risco DROP CONSTRAINT IF EXISTS classificacao_risco_severidade_check;
ALTER TABLE classificacao_risco DROP CONSTRAINT IF EXISTS classificacao_risco_probabilidade_check;

-- Remover colunas GENERATED que precisam ser recriadas
ALTER TABLE classificacao_risco DROP COLUMN IF EXISTS nivel_risco CASCADE;
ALTER TABLE classificacao_risco DROP COLUMN IF EXISTS classificacao_final CASCADE;

-- Alterar tipo das colunas existentes para VARCHAR
DO $$
BEGIN
    -- Alterar severidade para VARCHAR
    BEGIN
        ALTER TABLE classificacao_risco ALTER COLUMN severidade DROP NOT NULL;
        ALTER TABLE classificacao_risco ALTER COLUMN severidade TYPE VARCHAR(50) USING
            CASE severidade::INTEGER
                WHEN 1 THEN 'Inexistente'
                WHEN 2 THEN 'Levemente Prejudicial'
                WHEN 3 THEN 'Prejudicial'
                WHEN 4 THEN 'Extremamente Prejudicial'
                WHEN 5 THEN 'Extremamente Prejudicial'
                ELSE 'Inexistente'
            END;
    EXCEPTION WHEN OTHERS THEN
        -- Já é VARCHAR
        NULL;
    END;

    -- Alterar probabilidade para VARCHAR
    BEGIN
        ALTER TABLE classificacao_risco ALTER COLUMN probabilidade DROP NOT NULL;
        ALTER TABLE classificacao_risco ALTER COLUMN probabilidade TYPE VARCHAR(50) USING
            CASE probabilidade::INTEGER
                WHEN 1 THEN 'Baixa'
                WHEN 2 THEN 'Baixa'
                WHEN 3 THEN 'Média'
                WHEN 4 THEN 'Alta'
                WHEN 5 THEN 'Altíssima'
                ELSE 'Baixa'
            END;
    EXCEPTION WHEN OTHERS THEN
        -- Já é VARCHAR
        NULL;
    END;
END $$;

-- Adicionar novas colunas se não existirem
ALTER TABLE classificacao_risco ADD COLUMN IF NOT EXISTS tempo_exposicao VARCHAR(50);
ALTER TABLE classificacao_risco ADD COLUMN IF NOT EXISTS intensidade VARCHAR(50);
ALTER TABLE classificacao_risco ADD COLUMN IF NOT EXISTS peso_severidade INTEGER;
ALTER TABLE classificacao_risco ADD COLUMN IF NOT EXISTS peso_probabilidade DECIMAL(3,1);
ALTER TABLE classificacao_risco ADD COLUMN IF NOT EXISTS nivel_risco DECIMAL(5,2);
ALTER TABLE classificacao_risco ADD COLUMN IF NOT EXISTS classificacao_final VARCHAR(50);
