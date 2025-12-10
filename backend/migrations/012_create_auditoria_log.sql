-- Migration 012: Criar tabela de auditoria

CREATE TABLE IF NOT EXISTS auditoria_log (
  id SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  acao VARCHAR(50) NOT NULL,
  recurso VARCHAR(100) NOT NULL,
  metodo VARCHAR(10) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  status_code INTEGER,
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_body JSONB,
  response_body JSONB,
  erro TEXT,
  duracao_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id ON auditoria_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_empresa_id ON auditoria_log(empresa_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_acao ON auditoria_log(acao);
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON auditoria_log(created_at);
CREATE INDEX IF NOT EXISTS idx_auditoria_endpoint ON auditoria_log(endpoint);

COMMENT ON TABLE auditoria_log IS 'Tabela de auditoria de ações do sistema';
COMMENT ON COLUMN auditoria_log.usuario_id IS 'ID do usuário que realizou a ação';
COMMENT ON COLUMN auditoria_log.empresa_id IS 'ID da empresa do usuário';
COMMENT ON COLUMN auditoria_log.acao IS 'Tipo de ação (CREATE, READ, UPDATE, DELETE, LOGIN, etc)';
COMMENT ON COLUMN auditoria_log.recurso IS 'Recurso afetado (usuarios, avaliacoes, etc)';
COMMENT ON COLUMN auditoria_log.metodo IS 'Método HTTP (GET, POST, PUT, DELETE)';
COMMENT ON COLUMN auditoria_log.endpoint IS 'Endpoint da API chamado';
COMMENT ON COLUMN auditoria_log.status_code IS 'Código de status HTTP da resposta';
COMMENT ON COLUMN auditoria_log.ip_address IS 'Endereço IP da requisição';
COMMENT ON COLUMN auditoria_log.user_agent IS 'User agent do navegador/cliente';
COMMENT ON COLUMN auditoria_log.duracao_ms IS 'Duração da requisição em milissegundos';
