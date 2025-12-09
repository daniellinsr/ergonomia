-- Migration 004: Criar tabela de sessões
-- Adiciona tabela para gerenciar sessões ativas de usuários

CREATE TABLE IF NOT EXISTS sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  refresh_token_hash VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  ativo BOOLEAN DEFAULT true,
  expira_em TIMESTAMP NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_sessao_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario_id ON sessoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_token_hash ON sessoes(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessoes_ativo ON sessoes(ativo);
CREATE INDEX IF NOT EXISTS idx_sessoes_expira_em ON sessoes(expira_em);
