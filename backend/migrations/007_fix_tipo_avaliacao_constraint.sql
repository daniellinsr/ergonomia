-- Migration 007: Corrigir constraint de tipo_avaliacao
-- Remove constraint antigo e adiciona novo com mais valores aceitos

-- Remover constraint antigo
ALTER TABLE avaliacoes_ergonomicas DROP CONSTRAINT IF EXISTS avaliacoes_ergonomicas_tipo_avaliacao_check;

-- Adicionar novo constraint com mais opções (aceita qualquer valor VARCHAR)
-- Removendo o constraint completamente para permitir flexibilidade
-- ALTER TABLE avaliacoes_ergonomicas ADD CONSTRAINT avaliacoes_ergonomicas_tipo_avaliacao_check
--   CHECK (tipo_avaliacao IN ('preliminar', 'detalhada', 'reavaliacao', 'reavalicao', 'AEP', 'AET', 'Completa', 'Parcial'));

-- Nota: Constraint removido para permitir qualquer tipo de avaliação definido pelo usuário
