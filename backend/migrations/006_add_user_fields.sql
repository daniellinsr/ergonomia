-- Migration 006: Adicionar campos CPF e tipo_profissional à tabela usuarios
-- Adiciona colunas necessárias para o funcionamento do controller de usuários

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tipo_profissional VARCHAR(100);

-- Criar índice para CPF
CREATE INDEX IF NOT EXISTS idx_usuarios_cpf ON usuarios(cpf);
