-- Migration 009: Adicionar colunas de peso na tabela classificacao_risco
-- Adiciona peso_severidade e peso_probabilidade para cálculo de risco

-- Adicionar coluna peso_severidade se não existir
ALTER TABLE classificacao_risco
ADD COLUMN IF NOT EXISTS peso_severidade INTEGER;

-- Adicionar coluna peso_probabilidade se não existir
ALTER TABLE classificacao_risco
ADD COLUMN IF NOT EXISTS peso_probabilidade DECIMAL(3,1);

-- Atualizar valores existentes baseado na severidade
UPDATE classificacao_risco
SET peso_severidade = CASE
    WHEN severidade = 'Inexistente' THEN 1
    WHEN severidade = 'Levemente Prejudicial' THEN 2
    WHEN severidade = 'Prejudicial' THEN 3
    WHEN severidade = 'Extremamente Prejudicial' THEN 10
    ELSE 1
END
WHERE peso_severidade IS NULL;

-- Atualizar valores existentes baseado na probabilidade
UPDATE classificacao_risco
SET peso_probabilidade = CASE
    WHEN probabilidade = 'Baixa' THEN 0.5
    WHEN probabilidade = 'Média' THEN 1.0
    WHEN probabilidade = 'Alta' THEN 1.5
    WHEN probabilidade = 'Altíssima' THEN 2.0
    ELSE 0.5
END
WHERE peso_probabilidade IS NULL;
