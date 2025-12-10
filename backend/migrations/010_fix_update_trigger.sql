-- Migration 010: Corrigir trigger de atualização
-- O trigger ainda referencia 'atualizado_em' mas as colunas foram renomeadas para 'updated_at'

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS set_timestamp ON avaliacoes_ergonomicas;
DROP TRIGGER IF EXISTS set_timestamp ON classificacao_risco;
DROP TRIGGER IF EXISTS set_timestamp ON empresas;
DROP TRIGGER IF EXISTS set_timestamp ON usuarios;
DROP TRIGGER IF EXISTS set_timestamp ON unidades;
DROP TRIGGER IF EXISTS set_timestamp ON setores;
DROP TRIGGER IF EXISTS set_timestamp ON sessoes;
DROP TRIGGER IF EXISTS set_timestamp ON refresh_tokens;

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Criar nova função que usa 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar triggers para todas as tabelas que têm updated_at
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON avaliacoes_ergonomicas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON empresas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON unidades
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON setores
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON sessoes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
