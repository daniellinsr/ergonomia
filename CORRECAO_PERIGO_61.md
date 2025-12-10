# Correção: Categoria do Perigo 61

## 🎯 Problema Identificado

**Perigo #61**: "Trabalho em condições de difícil comunicação"

- ❌ **Categoria Incorreta**: Condições Físicas/Ambientais
- ✅ **Categoria Correta**: Organização/Cognitivo/Psicossocial

---

## 📝 Justificativa

"Trabalho em condições de difícil comunicação" é um perigo relacionado a:

- **Aspectos organizacionais**: Comunicação entre equipes
- **Aspectos cognitivos**: Compreensão e processamento de informações
- **Aspectos psicossociais**: Interação social e relacionamento interpessoal

**NÃO** é um perigo físico/ambiental como:
- Iluminação inadequada
- Temperatura fora do conforto
- Ruído excessivo
- Piso escorregadio

---

## 🔧 Correções Aplicadas

### 1. Migration 008 - Seed de Perigos (CORRIGIDO)

**Arquivo**: `backend/migrations/008_seed_perigos_catalogo.sql`

**Linha 78 - ANTES**:
```sql
(61, 'Condições Físicas/Ambientais', 'Trabalho em condições de difícil comunicação');
```

**Linha 78 - DEPOIS**:
```sql
(61, 'Organização/Cognitivo/Psicossocial', 'Trabalho em condições de difícil comunicação');
```

### 2. Migration 013 - Correção no Banco (NOVO)

**Arquivo**: `backend/migrations/013_fix_perigo_61_categoria.sql`

```sql
UPDATE perigos_catalogo
SET categoria = 'Organização/Cognitivo/Psicossocial'
WHERE numero = 61
  AND descricao = 'Trabalho em condições de difícil comunicação';
```

### 3. Script de Correção Imediata (NOVO)

**Arquivo**: `fix-perigo-61-categoria.sh`

Script interativo para aplicar a correção no banco de dados atual.

---

## 🚀 Como Aplicar a Correção

### Opção 1: Script Interativo (Recomendado)

No servidor, execute:

```bash
bash fix-perigo-61-categoria.sh
```

**O script vai**:
1. ✅ Mostrar estado atual do perigo 61
2. ✅ Solicitar confirmação
3. ✅ Aplicar correção
4. ✅ Verificar resultado

**Tempo**: ~30 segundos

---

### Opção 2: Migration Completa

Se preferir rodar todas as migrations (incluindo a 012 e 013):

```bash
bash run-migrations-simple.sh
```

**Nota**: Migrations são idempotentes, seguro rodar múltiplas vezes.

---

### Opção 3: SQL Manual

Se preferir executar manualmente:

```bash
# 1. Encontrar container PostgreSQL
POSTGRES_CONTAINER=$(docker ps --filter "name=ergonomia_postgres" --format "{{.Names}}" | grep -v backup | head -1)

# 2. Executar SQL
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
UPDATE perigos_catalogo
SET categoria = 'Organização/Cognitivo/Psicossocial'
WHERE numero = 61;
"
```

---

## 📊 Verificação

### Antes da Correção

```sql
SELECT numero, categoria, descricao
FROM perigos_catalogo
WHERE numero = 61;
```

**Resultado**:
```
 numero |          categoria          |                 descricao
--------+-----------------------------+-------------------------------------------
     61 | Condições Físicas/Ambientais | Trabalho em condições de difícil comunicação
```

### Após a Correção

```sql
SELECT numero, categoria, descricao
FROM perigos_catalogo
WHERE numero = 61;
```

**Resultado**:
```
 numero |              categoria              |                 descricao
--------+-------------------------------------+-------------------------------------------
     61 | Organização/Cognitivo/Psicossocial  | Trabalho em condições de difícil comunicação
```

---

## 🔍 Impacto da Correção

### ✅ O que VAI mudar

1. **Novas avaliações**:
   - Perigo 61 aparecerá na categoria correta
   - Agrupamento correto por categoria

2. **Catálogo de perigos**:
   - Categoria atualizada no banco
   - Contadores de categoria ajustados

### ⚠️ O que NÃO vai mudar

1. **Avaliações existentes**:
   - Avaliações já criadas manterão a categoria antiga
   - Não há necessidade de atualizar avaliações antigas

2. **Histórico**:
   - Dados históricos são preservados
   - Apenas o catálogo é atualizado

---

## 📈 Contagem de Perigos por Categoria

### Antes da Correção

```
Condições Físicas/Ambientais: 9 perigos (52-61)
Organização/Cognitivo/Psicossocial: 13 perigos (35-47)
```

### Após a Correção

```
Condições Físicas/Ambientais: 8 perigos (52-60)
Organização/Cognitivo/Psicossocial: 14 perigos (35-47, 61)
```

---

## 🗂️ Estrutura Correta de Categorias

### Organização/Cognitivo/Psicossocial (14 perigos)

- 35: Situações de sobrecarga de trabalho mental
- 36: Exigência de alto nível de concentração, atenção e memória
- 37: Trabalho em condições de difícil comunicação (duplicado do 61)
- 38: Excesso de conflitos hierárquicos no trabalho
- 39: Excesso de demandas emocionais/afetivas no trabalho
- 40: Formas de gestão/organização que dificultem a cooperação ou causem ruptura nos coletivos de trabalho
- 41: Falta de reconhecimento e valorização do trabalho
- 42: Indefinição/conflitos de papéis
- 43: Jornadas de trabalho excessivas ou escalas inadequadas
- 44: Monotonia, tarefas repetitivas ou com pouco conteúdo
- 45: Ritmo de trabalho intenso ou trabalho sob pressão temporal
- 46: Trabalho penoso ou indigno
- 47: Violências psicológicas, assédios morais e/ou sexuais
- **61**: Trabalho em condições de difícil comunicação ✅ (CORRIGIDO)

### Condições Físicas/Ambientais (8 perigos)

- 52: Ambiente com poeira, gases, vapores, fumaça ou odores desagradáveis
- 53: Condições de trabalho com iluminação diurna inadequada
- 54: Condições de trabalho com iluminação noturna inadequada
- 55: Condições de trabalho com índice de temperatura efetiva fora dos parâmetros de conforto
- 56: Condições de trabalho com níveis de pressão sonora fora dos parâmetros de conforto
- 57: Condições de trabalho com umidade do ar fora dos parâmetros de conforto
- 58: Condições de trabalho com velocidade do ar fora dos parâmetros de conforto
- 59: Presença de reflexos em telas, painéis, vidros, monitores ou qualquer superfície que causem desconforto ou prejudiquem a visualização
- 60: Piso escorregadio e/ou irregular
- ~~61~~: ~~Trabalho em condições de difícil comunicação~~ ❌ (REMOVIDO)

---

## ⚠️ Nota sobre Duplicação

**Observação importante**: O perigo "Trabalho em condições de difícil comunicação" aparece duas vezes no catálogo original:

- **Item 37**: Na categoria correta (Organização/Cognitivo/Psicossocial) ✅
- **Item 61**: Na categoria incorreta (Condições Físicas/Ambientais) ❌

Esta correção resolve a categorização errada do item 61, colocando-o na categoria correta.

---

## 🧪 Testes Recomendados

Após aplicar a correção:

### 1. Verificar no Banco de Dados

```sql
-- Ver perigo 61
SELECT numero, categoria, descricao
FROM perigos_catalogo
WHERE numero = 61;

-- Contar perigos por categoria
SELECT categoria, COUNT(*) as total
FROM perigos_catalogo
GROUP BY categoria
ORDER BY categoria;
```

### 2. Verificar na Interface

1. Acessar sistema
2. Criar nova avaliação
3. Expandir categoria "Organização/Cognitivo/Psicossocial"
4. Verificar se perigo 61 aparece nesta categoria

### 3. Verificar Não Aparece em Lugar Errado

1. Expandir categoria "Condições Físicas/Ambientais"
2. Verificar que perigo 61 **NÃO** aparece aqui
3. Último perigo deve ser 60 (Piso escorregadio e/ou irregular)

---

## 📋 Checklist de Verificação

Após aplicar a correção:

- [ ] Script executado sem erros
- [ ] Query de verificação mostra categoria correta
- [ ] Contagem de perigos por categoria está correta
- [ ] Interface mostra perigo 61 na categoria correta
- [ ] Perigo 61 não aparece em "Condições Físicas/Ambientais"
- [ ] Novas avaliações usam categoria correta

---

## 🔄 Rollback (Se Necessário)

Se precisar reverter (não recomendado):

```sql
UPDATE perigos_catalogo
SET categoria = 'Condições Físicas/Ambientais'
WHERE numero = 61;
```

**Nota**: Não há razão para fazer rollback, pois a correção está tecnicamente correta.

---

## 📚 Referências

- **NR-17**: Ergonomia
- **Catálogo de Perigos Ergonômicos**: Baseado em normas e literatura técnica
- **Classificação**: Organização/Cognitivo/Psicossocial vs. Físico/Ambiental

---

## ✅ Resumo

| Item | Status |
|------|--------|
| **Problema identificado** | ✅ Perigo 61 na categoria errada |
| **Migration 008 corrigida** | ✅ Arquivo atualizado |
| **Migration 013 criada** | ✅ Script de correção |
| **Script de correção criado** | ✅ fix-perigo-61-categoria.sh |
| **run-migrations-simple.sh atualizado** | ✅ Migration 013 adicionada |
| **Documentação criada** | ✅ Este arquivo |

**Pronto para aplicar!** 🚀

Execute: `bash fix-perigo-61-categoria.sh`
