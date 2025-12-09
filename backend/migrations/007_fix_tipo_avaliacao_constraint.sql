-- Migration 007: Corrigir constraint de tipo_avaliacao
-- Remove constraint antigo e adiciona novo com mais valores aceitos

-- Remover constraint antigo
ALTER TABLE avaliacoes_ergonomicas DROP CONSTRAINT IF EXISTS avaliacoes_ergonomicas_tipo_avaliacao_check;

-- Adicionar novo constraint com mais opções
ALTER TABLE avaliacoes_ergonomicas ADD CONSTRAINT avaliacoes_ergonomicas_tipo_avaliacao_check
  CHECK (tipo_avaliacao IN ('preliminar', 'detalhada', 'reavaliacao', 'reavalicao', 'AEP', 'AET'));

-- Nota: Mantive 'reavalicao' (erro de digitação) por compatibilidade com dados existentes
-- AEP = Análise Ergonômica Preliminar
-- AET = Análise Ergonômica do Trabalho
