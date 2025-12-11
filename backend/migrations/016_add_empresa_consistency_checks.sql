-- Migration 016: Adicionar validações de consistência de empresa_id
-- Garante que a hierarquia empresa -> unidade -> setor -> avaliação seja respeitada

-- =====================================================
-- 1. TRIGGER: Validar empresa_id em setores
-- =====================================================
-- Garante que o setor tenha o mesmo empresa_id da sua unidade

CREATE OR REPLACE FUNCTION validate_setor_empresa_id()
RETURNS TRIGGER AS $$
DECLARE
    v_unidade_empresa_id UUID;
BEGIN
    -- Buscar o empresa_id da unidade
    SELECT empresa_id INTO v_unidade_empresa_id
    FROM unidades
    WHERE id = NEW.unidade_id;

    -- Verificar se o empresa_id do setor é o mesmo da unidade
    IF NEW.empresa_id != v_unidade_empresa_id THEN
        RAISE EXCEPTION 'Setor deve pertencer à mesma empresa da unidade. Unidade pertence à empresa %, mas setor está sendo criado para empresa %',
            v_unidade_empresa_id, NEW.empresa_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger BEFORE INSERT e UPDATE em setores
DROP TRIGGER IF EXISTS trigger_validate_setor_empresa_id ON setores;
CREATE TRIGGER trigger_validate_setor_empresa_id
    BEFORE INSERT OR UPDATE ON setores
    FOR EACH ROW
    EXECUTE FUNCTION validate_setor_empresa_id();

-- =====================================================
-- 2. TRIGGER: Validar empresa_id em avaliações
-- =====================================================
-- Garante que a avaliação tenha o mesmo empresa_id do seu setor

CREATE OR REPLACE FUNCTION validate_avaliacao_empresa_id()
RETURNS TRIGGER AS $$
DECLARE
    v_setor_empresa_id UUID;
BEGIN
    -- Buscar o empresa_id do setor
    SELECT empresa_id INTO v_setor_empresa_id
    FROM setores
    WHERE id = NEW.setor_id;

    -- Verificar se o empresa_id da avaliação é o mesmo do setor
    IF NEW.empresa_id != v_setor_empresa_id THEN
        RAISE EXCEPTION 'Avaliação deve pertencer à mesma empresa do setor. Setor pertence à empresa %, mas avaliação está sendo criada para empresa %',
            v_setor_empresa_id, NEW.empresa_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger BEFORE INSERT e UPDATE em avaliacoes_ergonomicas
DROP TRIGGER IF EXISTS trigger_validate_avaliacao_empresa_id ON avaliacoes_ergonomicas;
CREATE TRIGGER trigger_validate_avaliacao_empresa_id
    BEFORE INSERT OR UPDATE ON avaliacoes_ergonomicas
    FOR EACH ROW
    EXECUTE FUNCTION validate_avaliacao_empresa_id();

-- =====================================================
-- 3. TRIGGER: Auto-sincronizar empresa_id em setores
-- =====================================================
-- Quando a unidade mudar de empresa, atualiza automaticamente os setores

CREATE OR REPLACE FUNCTION sync_setor_empresa_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o empresa_id da unidade mudou, atualizar todos os setores
    IF NEW.empresa_id != OLD.empresa_id THEN
        UPDATE setores
        SET empresa_id = NEW.empresa_id
        WHERE unidade_id = NEW.id;

        RAISE NOTICE 'Empresa da unidade % alterada. Setores atualizados automaticamente.', NEW.nome;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger AFTER UPDATE em unidades
DROP TRIGGER IF EXISTS trigger_sync_setor_empresa_id ON unidades;
CREATE TRIGGER trigger_sync_setor_empresa_id
    AFTER UPDATE ON unidades
    FOR EACH ROW
    WHEN (OLD.empresa_id IS DISTINCT FROM NEW.empresa_id)
    EXECUTE FUNCTION sync_setor_empresa_id();

-- =====================================================
-- 4. TRIGGER: Auto-sincronizar empresa_id em avaliações
-- =====================================================
-- Quando o setor mudar de empresa, atualiza automaticamente as avaliações

CREATE OR REPLACE FUNCTION sync_avaliacao_empresa_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o empresa_id do setor mudou, atualizar todas as avaliações
    IF NEW.empresa_id != OLD.empresa_id THEN
        UPDATE avaliacoes_ergonomicas
        SET empresa_id = NEW.empresa_id
        WHERE setor_id = NEW.id;

        RAISE NOTICE 'Empresa do setor % alterada. Avaliações atualizadas automaticamente.', NEW.nome;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger AFTER UPDATE em setores
DROP TRIGGER IF EXISTS trigger_sync_avaliacao_empresa_id ON setores;
CREATE TRIGGER trigger_sync_avaliacao_empresa_id
    AFTER UPDATE ON setores
    FOR EACH ROW
    WHEN (OLD.empresa_id IS DISTINCT FROM NEW.empresa_id)
    EXECUTE FUNCTION sync_avaliacao_empresa_id();

-- =====================================================
-- 5. FUNÇÃO: Corrigir inconsistências existentes
-- =====================================================
-- Função utilitária para corrigir dados existentes

CREATE OR REPLACE FUNCTION fix_empresa_id_inconsistencies()
RETURNS TABLE(
    tipo TEXT,
    registros_corrigidos INTEGER
) AS $$
DECLARE
    v_setores_corrigidos INTEGER;
    v_avaliacoes_corrigidas INTEGER;
BEGIN
    -- Corrigir setores com empresa_id diferente da unidade
    WITH setores_corrigidos AS (
        UPDATE setores s
        SET empresa_id = u.empresa_id
        FROM unidades u
        WHERE s.unidade_id = u.id
        AND s.empresa_id != u.empresa_id
        RETURNING s.id
    )
    SELECT COUNT(*) INTO v_setores_corrigidos FROM setores_corrigidos;

    -- Corrigir avaliações com empresa_id diferente do setor
    WITH avaliacoes_corrigidas AS (
        UPDATE avaliacoes_ergonomicas a
        SET empresa_id = s.empresa_id
        FROM setores s
        WHERE a.setor_id = s.id
        AND a.empresa_id != s.empresa_id
        RETURNING a.id
    )
    SELECT COUNT(*) INTO v_avaliacoes_corrigidas FROM avaliacoes_corrigidas;

    -- Retornar resultados
    RETURN QUERY
    SELECT 'Setores'::TEXT, v_setores_corrigidos
    UNION ALL
    SELECT 'Avaliações'::TEXT, v_avaliacoes_corrigidas;
END;
$$ LANGUAGE plpgsql;

-- Executar a correção automaticamente nesta migration
SELECT * FROM fix_empresa_id_inconsistencies();

-- =====================================================
-- 6. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION validate_setor_empresa_id() IS
'Valida que o setor pertence à mesma empresa da sua unidade antes de INSERT/UPDATE';

COMMENT ON FUNCTION validate_avaliacao_empresa_id() IS
'Valida que a avaliação pertence à mesma empresa do seu setor antes de INSERT/UPDATE';

COMMENT ON FUNCTION sync_setor_empresa_id() IS
'Sincroniza automaticamente o empresa_id dos setores quando a unidade muda de empresa';

COMMENT ON FUNCTION sync_avaliacao_empresa_id() IS
'Sincroniza automaticamente o empresa_id das avaliações quando o setor muda de empresa';

COMMENT ON FUNCTION fix_empresa_id_inconsistencies() IS
'Função utilitária para corrigir inconsistências de empresa_id em setores e avaliações';
