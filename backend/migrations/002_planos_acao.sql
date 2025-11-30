-- Tabela de Planos de Ação 5W2H
CREATE TABLE IF NOT EXISTS planos_5w2h (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  avaliacao_id UUID REFERENCES avaliacoes_ergonomicas(id) ON DELETE SET NULL,
  titulo VARCHAR(255) NOT NULL,
  
  -- 5W2H
  what TEXT NOT NULL, -- O que será feito?
  why TEXT NOT NULL, -- Por que será feito?
  who VARCHAR(255) NOT NULL, -- Quem será responsável?
  when_date DATE NOT NULL, -- Quando será feito?
  where_location VARCHAR(255) NOT NULL, -- Onde será feito?
  how TEXT NOT NULL, -- Como será feito?
  how_much VARCHAR(100) NOT NULL, -- Quanto custa?
  
  -- Controle
  prioridade VARCHAR(20) NOT NULL CHECK (prioridade IN ('baixa', 'media', 'alta')),
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'andamento', 'concluido', 'cancelado')),
  progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  
  -- Auditoria
  criado_por UUID NOT NULL REFERENCES usuarios(id),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Tabela de Ações Corretivas
CREATE TABLE IF NOT EXISTS acoes_corretivas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  avaliacao_id UUID REFERENCES avaliacoes_ergonomicas(id) ON DELETE SET NULL,
  titulo VARCHAR(255) NOT NULL,
  
  -- Detalhes da ação
  descricao_problema TEXT NOT NULL,
  causa_raiz TEXT NOT NULL,
  acao_corretiva TEXT NOT NULL,
  
  -- Responsável e prazo
  responsavel VARCHAR(255) NOT NULL,
  prazo DATE NOT NULL,
  
  -- Classificação
  prioridade VARCHAR(20) NOT NULL CHECK (prioridade IN ('baixa', 'media', 'alta')),
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('ergonomia', 'equipamento', 'processo', 'treinamento', 'organizacao')),
  
  -- Controle
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'andamento', 'concluido', 'cancelado')),
  progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  
  -- Auditoria
  criado_por UUID NOT NULL REFERENCES usuarios(id),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_empresa_acao FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Tabela de Ciclos PDCA
CREATE TABLE IF NOT EXISTS ciclos_pdca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  avaliacao_id UUID REFERENCES avaliacoes_ergonomicas(id) ON DELETE SET NULL,
  titulo VARCHAR(255) NOT NULL,
  
  -- Fases do PDCA
  plan TEXT NOT NULL, -- Planejamento
  doo TEXT NOT NULL, -- Execução
  check_phase TEXT NOT NULL, -- Verificação (usando check_phase pois "check" é palavra reservada)
  act TEXT NOT NULL, -- Ação
  
  -- Controle
  responsavel VARCHAR(255) NOT NULL,
  data_inicio DATE NOT NULL,
  data_conclusao DATE,
  fase_atual VARCHAR(20) NOT NULL DEFAULT 'plan' CHECK (fase_atual IN ('plan', 'do', 'check', 'act')),
  status VARCHAR(20) NOT NULL DEFAULT 'andamento' CHECK (status IN ('pendente', 'andamento', 'concluido', 'cancelado')),
  progresso INTEGER DEFAULT 25 CHECK (progresso >= 0 AND progresso <= 100),
  
  -- Auditoria
  criado_por UUID NOT NULL REFERENCES usuarios(id),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_empresa_pdca FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Tabela de Histórico de Atualizações (para auditoria)
CREATE TABLE IF NOT EXISTS planos_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_plano VARCHAR(20) NOT NULL CHECK (tipo_plano IN ('5w2h', 'acao_corretiva', 'pdca')),
  plano_id UUID NOT NULL,
  campo_alterado VARCHAR(100) NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  alterado_por UUID NOT NULL REFERENCES usuarios(id),
  alterado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_planos_5w2h_empresa ON planos_5w2h(empresa_id);
CREATE INDEX IF NOT EXISTS idx_planos_5w2h_status ON planos_5w2h(status);
CREATE INDEX IF NOT EXISTS idx_planos_5w2h_prioridade ON planos_5w2h(prioridade);
CREATE INDEX IF NOT EXISTS idx_planos_5w2h_avaliacao ON planos_5w2h(avaliacao_id);

CREATE INDEX IF NOT EXISTS idx_acoes_corretivas_empresa ON acoes_corretivas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_acoes_corretivas_status ON acoes_corretivas(status);
CREATE INDEX IF NOT EXISTS idx_acoes_corretivas_prioridade ON acoes_corretivas(prioridade);
CREATE INDEX IF NOT EXISTS idx_acoes_corretivas_avaliacao ON acoes_corretivas(avaliacao_id);

CREATE INDEX IF NOT EXISTS idx_ciclos_pdca_empresa ON ciclos_pdca(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ciclos_pdca_status ON ciclos_pdca(status);
CREATE INDEX IF NOT EXISTS idx_ciclos_pdca_fase ON ciclos_pdca(fase_atual);
CREATE INDEX IF NOT EXISTS idx_ciclos_pdca_avaliacao ON ciclos_pdca(avaliacao_id);

CREATE INDEX IF NOT EXISTS idx_planos_historico_plano ON planos_historico(plano_id, tipo_plano);
CREATE INDEX IF NOT EXISTS idx_planos_historico_data ON planos_historico(alterado_em);

-- Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_planos_5w2h_updated_at BEFORE UPDATE ON planos_5w2h
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_acoes_corretivas_updated_at BEFORE UPDATE ON acoes_corretivas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ciclos_pdca_updated_at BEFORE UPDATE ON ciclos_pdca
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
