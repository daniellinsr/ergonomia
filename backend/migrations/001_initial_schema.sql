-- Migration Inicial - Sistema de Gestão Ergonômica
-- Cria todas as tabelas base do sistema

-- Habilitar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de Empresas
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255),
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('administrador', 'gestor', 'avaliador', 'visualizador')),
  ativo BOOLEAN DEFAULT true,
  ultimo_acesso TIMESTAMP,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_usuario_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Tabela de Refresh Tokens (para autenticação)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expira_em TIMESTAMP NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_refresh_token_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de Unidades
CREATE TABLE IF NOT EXISTS unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  responsavel VARCHAR(255),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_unidade_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Tabela de Setores (GSE)
CREATE TABLE IF NOT EXISTS setores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  responsavel VARCHAR(255),
  numero_trabalhadores INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_setor_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  CONSTRAINT fk_setor_unidade FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE
);

-- Tabela de Catálogo de Perigos (61 perigos ergonômicos)
CREATE TABLE IF NOT EXISTS perigos_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER UNIQUE NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  detalhamento TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Avaliações Ergonômicas
CREATE TABLE IF NOT EXISTS avaliacoes_ergonomicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  setor_id UUID NOT NULL REFERENCES setores(id) ON DELETE CASCADE,
  avaliador_id UUID NOT NULL REFERENCES usuarios(id),
  tipo_avaliacao VARCHAR(50) NOT NULL CHECK (tipo_avaliacao IN ('preliminar', 'detalhada', 'reavalicao')),
  titulo VARCHAR(255),
  descricao TEXT,
  data_avaliacao DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes_gerais TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluida', 'cancelada')),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_avaliacao_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  CONSTRAINT fk_avaliacao_setor FOREIGN KEY (setor_id) REFERENCES setores(id) ON DELETE CASCADE,
  CONSTRAINT fk_avaliacao_avaliador FOREIGN KEY (avaliador_id) REFERENCES usuarios(id)
);

-- Tabela de Perigos Identificados
CREATE TABLE IF NOT EXISTS perigos_identificados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id UUID NOT NULL REFERENCES avaliacoes_ergonomicas(id) ON DELETE CASCADE,
  perigo_id UUID NOT NULL REFERENCES perigos_catalogo(id),
  identificado BOOLEAN DEFAULT false,
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_perigo_identificado_avaliacao FOREIGN KEY (avaliacao_id) REFERENCES avaliacoes_ergonomicas(id) ON DELETE CASCADE,
  CONSTRAINT fk_perigo_identificado_catalogo FOREIGN KEY (perigo_id) REFERENCES perigos_catalogo(id),
  CONSTRAINT unique_perigo_por_avaliacao UNIQUE (avaliacao_id, perigo_id)
);

-- Tabela de Classificação de Risco
CREATE TABLE IF NOT EXISTS classificacao_risco (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perigo_identificado_id UUID NOT NULL REFERENCES perigos_identificados(id) ON DELETE CASCADE,
  severidade INTEGER NOT NULL CHECK (severidade BETWEEN 1 AND 5),
  probabilidade INTEGER NOT NULL CHECK (probabilidade BETWEEN 1 AND 5),
  nivel_risco INTEGER GENERATED ALWAYS AS (severidade * probabilidade) STORED,
  classificacao_final VARCHAR(20) GENERATED ALWAYS AS (
    CASE
      WHEN (severidade * probabilidade) >= 20 THEN 'Intolerável'
      WHEN (severidade * probabilidade) BETWEEN 10 AND 19 THEN 'Substancial'
      WHEN (severidade * probabilidade) BETWEEN 5 AND 9 THEN 'Moderado'
      ELSE 'Tolerável'
    END
  ) STORED,
  medidas_controle TEXT,
  prazo_implementacao DATE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_classificacao_perigo FOREIGN KEY (perigo_identificado_id) REFERENCES perigos_identificados(id) ON DELETE CASCADE,
  CONSTRAINT unique_classificacao_perigo UNIQUE (perigo_identificado_id)
);

-- Tabela de Auditoria
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela VARCHAR(100) NOT NULL,
  registro_id UUID NOT NULL,
  operacao VARCHAR(20) NOT NULL CHECK (operacao IN ('INSERT', 'UPDATE', 'DELETE')),
  usuario_id UUID REFERENCES usuarios(id),
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario ON refresh_tokens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expiracao ON refresh_tokens(expira_em);

CREATE INDEX IF NOT EXISTS idx_unidades_empresa ON unidades(empresa_id);
CREATE INDEX IF NOT EXISTS idx_unidades_ativo ON unidades(ativo);

CREATE INDEX IF NOT EXISTS idx_setores_empresa ON setores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_setores_unidade ON setores(unidade_id);
CREATE INDEX IF NOT EXISTS idx_setores_ativo ON setores(ativo);

CREATE INDEX IF NOT EXISTS idx_perigos_catalogo_numero ON perigos_catalogo(numero);
CREATE INDEX IF NOT EXISTS idx_perigos_catalogo_categoria ON perigos_catalogo(categoria);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_empresa ON avaliacoes_ergonomicas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_setor ON avaliacoes_ergonomicas(setor_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_avaliador ON avaliacoes_ergonomicas(avaliador_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_status ON avaliacoes_ergonomicas(status);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_data ON avaliacoes_ergonomicas(data_avaliacao);

CREATE INDEX IF NOT EXISTS idx_perigos_identificados_avaliacao ON perigos_identificados(avaliacao_id);
CREATE INDEX IF NOT EXISTS idx_perigos_identificados_perigo ON perigos_identificados(perigo_id);
CREATE INDEX IF NOT EXISTS idx_perigos_identificados_identificado ON perigos_identificados(identificado);

CREATE INDEX IF NOT EXISTS idx_classificacao_risco_perigo ON classificacao_risco(perigo_identificado_id);
CREATE INDEX IF NOT EXISTS idx_classificacao_risco_nivel ON classificacao_risco(nivel_risco);
CREATE INDEX IF NOT EXISTS idx_classificacao_risco_classificacao ON classificacao_risco(classificacao_final);

CREATE INDEX IF NOT EXISTS idx_audit_log_tabela ON audit_log(tabela);
CREATE INDEX IF NOT EXISTS idx_audit_log_registro ON audit_log(registro_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_usuario ON audit_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_data ON audit_log(criado_em);

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar timestamp automaticamente
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unidades_updated_at BEFORE UPDATE ON unidades
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_setores_updated_at BEFORE UPDATE ON setores
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_avaliacoes_updated_at BEFORE UPDATE ON avaliacoes_ergonomicas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_perigos_identificados_updated_at BEFORE UPDATE ON perigos_identificados
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classificacao_risco_updated_at BEFORE UPDATE ON classificacao_risco
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir os 61 perigos ergonômicos do catálogo
INSERT INTO perigos_catalogo (numero, categoria, descricao, detalhamento) VALUES
(1, 'Levantamento e Transporte Manual de Cargas', 'Levantamento e transporte manual de cargas', 'Atividades que envolvem levantar, abaixar, empurrar, puxar ou transportar cargas manualmente'),
(2, 'Mobiliário e Equipamentos', 'Mobiliário dos postos de trabalho inadequado', 'Cadeiras, mesas, bancadas sem ajustes ou inadequadas ao trabalho'),
(3, 'Mobiliário e Equipamentos', 'Equipamentos dos postos de trabalho inadequados', 'Monitores, teclados, mouse inadequados ou mal posicionados'),
(4, 'Condições Ambientais', 'Condições de iluminação inadequadas', 'Iluminação insuficiente, excessiva ou com reflexos'),
(5, 'Condições Ambientais', 'Condições de conforto térmico inadequadas', 'Temperatura, umidade ou ventilação inadequadas'),
(6, 'Condições Ambientais', 'Níveis de ruído elevados', 'Ruído contínuo ou intermitente acima dos limites'),
(7, 'Postura e Movimento', 'Exigência de posturas inadequadas', 'Posturas forçadas, assimétricas ou estáticas prolongadas'),
(8, 'Postura e Movimento', 'Movimentos repetitivos', 'Realização de movimentos repetitivos com alta frequência'),
(9, 'Postura e Movimento', 'Exigência de força excessiva', 'Necessidade de aplicar força manual ou corporal excessiva'),
(10, 'Organização do Trabalho', 'Ritmo de trabalho excessivo', 'Demanda de produção acima da capacidade'),
(11, 'Organização do Trabalho', 'Jornada de trabalho prolongada', 'Jornadas extensas ou horas extras excessivas'),
(12, 'Organização do Trabalho', 'Pausas insuficientes', 'Ausência ou insuficiência de pausas durante a jornada'),
(13, 'Mobiliário e Equipamentos', 'Espaço de trabalho insuficiente', 'Área de trabalho reduzida ou congestionada'),
(14, 'Postura e Movimento', 'Alcance inadequado', 'Ferramentas ou materiais fora da zona de alcance confortável'),
(15, 'Condições Ambientais', 'Vibração', 'Exposição a vibrações de corpo inteiro ou mão-braço'),
(16, 'Organização do Trabalho', 'Trabalho em turnos alternados', 'Rodízio de turnos ou trabalho noturno'),
(17, 'Organização do Trabalho', 'Monotonia e repetitividade das tarefas', 'Tarefas monótonas sem variedade'),
(18, 'Organização do Trabalho', 'Exigências cognitivas elevadas', 'Alta demanda de atenção, memória ou tomada de decisões'),
(19, 'Organização do Trabalho', 'Pressão temporal', 'Prazos curtos ou pressão por velocidade'),
(20, 'Organização do Trabalho', 'Complexidade das tarefas', 'Tarefas muito complexas ou multitarefas excessivas'),
(21, 'Postura e Movimento', 'Postura sentada prolongada', 'Permanência sentada por longos períodos'),
(22, 'Postura e Movimento', 'Postura em pé prolongada', 'Permanência em pé por longos períodos'),
(23, 'Postura e Movimento', 'Postura ajoelhada ou agachada', 'Trabalho frequente ajoelhado ou agachado'),
(24, 'Postura e Movimento', 'Trabalho com braços elevados', 'Braços elevados acima da altura dos ombros'),
(25, 'Postura e Movimento', 'Torção ou inclinação de tronco', 'Movimentos frequentes de torção ou flexão do tronco'),
(26, 'Levantamento e Transporte Manual de Cargas', 'Transporte de cargas em distâncias longas', 'Transporte manual de cargas por longas distâncias'),
(27, 'Levantamento e Transporte Manual de Cargas', 'Manuseio de cargas acima da altura dos ombros', 'Levantamento ou colocação de cargas em alturas elevadas'),
(28, 'Levantamento e Transporte Manual de Cargas', 'Manuseio de cargas abaixo dos joelhos', 'Levantamento de cargas do chão ou de alturas baixas'),
(29, 'Mobiliário e Equipamentos', 'Ferramentas manuais inadequadas', 'Ferramentas pesadas, desbalanceadas ou sem manutenção'),
(30, 'Mobiliário e Equipamentos', 'Dispositivos de entrada inadequados', 'Mouse, teclado ou outros dispositivos inadequados'),
(31, 'Condições Ambientais', 'Qualidade do ar inadequada', 'Ventilação deficiente ou presença de contaminantes'),
(32, 'Condições Ambientais', 'Umidade inadequada', 'Ar muito seco ou muito úmido'),
(33, 'Organização do Trabalho', 'Falta de autonomia', 'Pouco controle sobre o próprio trabalho'),
(34, 'Organização do Trabalho', 'Falta de suporte social', 'Ausência de apoio de colegas ou supervisores'),
(35, 'Organização do Trabalho', 'Conflitos no trabalho', 'Conflitos interpessoais ou com supervisores'),
(36, 'Organização do Trabalho', 'Insegurança no emprego', 'Medo de demissão ou instabilidade'),
(37, 'Organização do Trabalho', 'Assédio moral', 'Exposição a assédio moral ou bullying'),
(38, 'Postura e Movimento', 'Uso excessivo de força de preensão', 'Força excessiva nas mãos para segurar objetos'),
(39, 'Postura e Movimento', 'Movimentos de pinça com dedos', 'Uso frequente de pinça fina com os dedos'),
(40, 'Postura e Movimento', 'Desvios de punho', 'Flexão, extensão ou desvio radial/ulnar do punho'),
(41, 'Postura e Movimento', 'Rotação de antebraço', 'Movimentos frequentes de pronação/supinação'),
(42, 'Condições Ambientais', 'Exposição a temperaturas extremas', 'Trabalho em ambientes muito quentes ou frios'),
(43, 'Condições Ambientais', 'Ofuscamento', 'Brilho excessivo ou reflexos nas superfícies de trabalho'),
(44, 'Mobiliário e Equipamentos', 'Plataformas ou pisos inadequados', 'Pisos irregulares, escorregadios ou desnivelados'),
(45, 'Mobiliário e Equipamentos', 'Ausência de apoio para os pés', 'Falta de apoio adequado para os pés'),
(46, 'Mobiliário e Equipamentos', 'Apoio inadequado para documentos', 'Ausência ou inadequação de suporte para documentos'),
(47, 'Organização do Trabalho', 'Trabalho isolado', 'Trabalho sem contato com outras pessoas'),
(48, 'Organização do Trabalho', 'Falta de treinamento', 'Treinamento insuficiente para a tarefa'),
(49, 'Organização do Trabalho', 'Metas inatingíveis', 'Metas de produção impossíveis de alcançar'),
(50, 'Organização do Trabalho', 'Falta de participação nas decisões', 'Exclusão do processo decisório'),
(51, 'Postura e Movimento', 'Contato com bordas ou quinas', 'Pressão de ferramentas ou superfícies no corpo'),
(52, 'Levantamento e Transporte Manual de Cargas', 'Cargas instáveis ou difíceis de segurar', 'Manuseio de cargas sem pegas adequadas'),
(53, 'Levantamento e Transporte Manual de Cargas', 'Frequência elevada de levantamento', 'Levantamentos repetidos em curto período'),
(54, 'Mobiliário e Equipamentos', 'Layout inadequado', 'Arranjo físico deficiente do posto de trabalho'),
(55, 'Condições Ambientais', 'Contraste inadequado', 'Falta de contraste entre objeto e fundo'),
(56, 'Organização do Trabalho', 'Trabalho noturno permanente', 'Trabalho exclusivamente em turno noturno'),
(57, 'Organização do Trabalho', 'Responsabilidades excessivas', 'Responsabilidades desproporcionais ao cargo'),
(58, 'Organização do Trabalho', 'Ambiguidade de papéis', 'Falta de clareza nas atribuições'),
(59, 'Postura e Movimento', 'Alcance vertical excessivo', 'Necessidade de alcançar acima ou abaixo da zona confortável'),
(60, 'Postura e Movimento', 'Alcance horizontal excessivo', 'Necessidade de estender braços além da zona confortável'),
(61, 'Organização do Trabalho', 'Interrupções frequentes', 'Trabalho constantemente interrompido');

-- Comentários nas tabelas para documentação
COMMENT ON TABLE empresas IS 'Cadastro de empresas clientes do sistema';
COMMENT ON TABLE usuarios IS 'Usuários do sistema com diferentes perfis de acesso';
COMMENT ON TABLE refresh_tokens IS 'Tokens de refresh para autenticação JWT';
COMMENT ON TABLE unidades IS 'Unidades/filiais das empresas';
COMMENT ON TABLE setores IS 'Setores/GSE (Grupos Similares de Exposição) das unidades';
COMMENT ON TABLE perigos_catalogo IS 'Catálogo dos 61 perigos ergonômicos padronizados';
COMMENT ON TABLE avaliacoes_ergonomicas IS 'Avaliações ergonômicas realizadas nos setores';
COMMENT ON TABLE perigos_identificados IS 'Perigos identificados em cada avaliação';
COMMENT ON TABLE classificacao_risco IS 'Classificação de risco dos perigos identificados';
COMMENT ON TABLE audit_log IS 'Log de auditoria de todas as operações no sistema';
