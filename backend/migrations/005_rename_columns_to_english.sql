-- Migration 005: Renomear colunas para inglês
-- Padroniza nomes de colunas de português para inglês

-- Tabela empresas
ALTER TABLE empresas RENAME COLUMN criado_em TO created_at;
ALTER TABLE empresas RENAME COLUMN atualizado_em TO updated_at;

-- Tabela usuarios
ALTER TABLE usuarios RENAME COLUMN criado_em TO created_at;
ALTER TABLE usuarios RENAME COLUMN atualizado_em TO updated_at;

-- Tabela refresh_tokens
ALTER TABLE refresh_tokens RENAME COLUMN criado_em TO created_at;

-- Tabela unidades
ALTER TABLE unidades RENAME COLUMN criado_em TO created_at;
ALTER TABLE unidades RENAME COLUMN atualizado_em TO updated_at;

-- Tabela setores
ALTER TABLE setores RENAME COLUMN criado_em TO created_at;
ALTER TABLE setores RENAME COLUMN atualizado_em TO updated_at;

-- Tabela perigos_catalogo
ALTER TABLE perigos_catalogo RENAME COLUMN criado_em TO created_at;

-- Tabela avaliacoes_ergonomicas
ALTER TABLE avaliacoes_ergonomicas RENAME COLUMN criado_em TO created_at;
ALTER TABLE avaliacoes_ergonomicas RENAME COLUMN atualizado_em TO updated_at;

-- Tabela sessoes
ALTER TABLE sessoes RENAME COLUMN criado_em TO created_at;
ALTER TABLE sessoes RENAME COLUMN atualizado_em TO updated_at;
