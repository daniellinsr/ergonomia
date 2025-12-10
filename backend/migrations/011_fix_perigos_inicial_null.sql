-- Migration 011: Corrigir perigos inicialmente criados com false para NULL
-- Quando uma avaliação é criada, os perigos devem começar com NULL (não avaliado)
-- em vez de false (não identificado)

-- Para avaliações em andamento, reseta perigos que nunca foram classificados
-- Se o perigo está marcado como identificado=false E não tem classificação de risco,
-- então nunca foi realmente avaliado, deve ser NULL

UPDATE perigos_identificados pi
SET identificado = NULL
WHERE identificado = false
  AND NOT EXISTS (
    SELECT 1 
    FROM classificacao_risco cr 
    WHERE cr.perigo_identificado_id = pi.id
  )
  AND EXISTS (
    SELECT 1
    FROM avaliacoes_ergonomicas ae
    WHERE ae.id = pi.avaliacao_id
    AND ae.status = 'em_andamento'
  );
