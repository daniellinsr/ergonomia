-- Migration para remover o módulo de trabalhadores
-- As avaliações agora serão vinculadas diretamente ao setor

-- 1. Primeiro, deletar avaliações que não têm setor_id
-- (estas são avaliações antigas que não podem ser migradas)
DELETE FROM avaliacoes_ergonomicas WHERE setor_id IS NULL;

-- 2. Alterar a tabela de avaliações ergonômicas
-- Remover a coluna trabalhador_id e tornar setor_id obrigatório
ALTER TABLE avaliacoes_ergonomicas
  DROP COLUMN IF EXISTS trabalhador_id CASCADE,
  ALTER COLUMN setor_id SET NOT NULL;

-- 3. Remover a tabela de trabalhadores
DROP TABLE IF EXISTS trabalhadores CASCADE;

-- 4. Adicionar campos adicionais na tabela de avaliações para informações contextuais
ALTER TABLE avaliacoes_ergonomicas
  ADD COLUMN IF NOT EXISTS titulo VARCHAR(255),
  ADD COLUMN IF NOT EXISTS descricao TEXT;

-- 5. Adicionar índice para melhorar performance nas consultas por setor
CREATE INDEX IF NOT EXISTS idx_avaliacoes_setor ON avaliacoes_ergonomicas(setor_id);

-- 6. Adicionar comentários nas tabelas para documentação
COMMENT ON COLUMN avaliacoes_ergonomicas.setor_id IS 'Setor onde a avaliação ergonômica foi realizada';
COMMENT ON COLUMN avaliacoes_ergonomicas.titulo IS 'Título descritivo da avaliação';
COMMENT ON COLUMN avaliacoes_ergonomicas.descricao IS 'Descrição detalhada do contexto da avaliação';
