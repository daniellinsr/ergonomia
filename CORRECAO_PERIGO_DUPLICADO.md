# Correção: Remoção de Duplicação do Perigo 61

## 🎯 Problema Identificado

**Duplicação**: "Trabalho em condições de difícil comunicação"

- ✅ **Item 37**: Correto, na categoria "Organização/Cognitivo/Psicossocial"
- ❌ **Item 61**: Duplicado INCORRETAMENTE em "Condições Físicas/Ambientais"

**Solução**: Remover item 61 (duplicado), mantendo apenas o item 37

---

## 📊 Antes e Depois

### ANTES (61 perigos com duplicação)

```
Item 37: "Trabalho em condições de difícil comunicação"
         Categoria: Organização/Cognitivo/Psicossocial ✅

Item 61: "Trabalho em condições de difícil comunicação"
         Categoria: Condições Físicas/Ambientais ❌ (DUPLICADO!)
```

**Total**: 61 perigos (mas apenas 60 únicos)

### DEPOIS (60 perigos sem duplicação)

```
Item 37: "Trabalho em condições de difícil comunicação"
         Categoria: Organização/Cognitivo/Psicossocial ✅

Item 61: (REMOVIDO)
```

**Total**: 60 perigos (todos únicos, numeração 1-60)

---

## 🔧 Correções Aplicadas

### 1. Migration 008 - Seed de Perigos (CORRIGIDO)

**Arquivo**: `backend/migrations/008_seed_perigos_catalogo.sql`

**ANTES** (linha 2):
```sql
-- Insere os 61 perigos ergonômicos conforme NR-17
```

**DEPOIS** (linha 2):
```sql
-- Insere os 60 perigos ergonômicos conforme NR-17
```

**ANTES** (linhas 68-78):
```sql
-- Condições físico/ambientais (53-61)
INSERT INTO perigos_catalogo (numero, categoria, descricao) VALUES
...
(60, 'Condições Físicas/Ambientais', 'Piso escorregadio e/ou irregular'),
(61, 'Condições Físicas/Ambientais', 'Trabalho em condições de difícil comunicação');
```

**DEPOIS** (linhas 68-77):
```sql
-- Condições físico/ambientais (53-60)
INSERT INTO perigos_catalogo (numero, categoria, descricao) VALUES
...
(60, 'Condições Físicas/Ambientais', 'Piso escorregadio e/ou irregular');
```

---

### 2. Migration 013 - Remover Duplicação (NOVA)

**Arquivo**: `backend/migrations/013_fix_perigo_61_categoria.sql`

```sql
-- Remover perigo 61 (duplicado)
DELETE FROM perigos_catalogo
WHERE numero = 61
  AND descricao = 'Trabalho em condições de difícil comunicação'
  AND categoria = 'Condições Físicas/Ambientais';
```

**Verificações automáticas**:
- ✅ Confirma que item 37 foi mantido
- ✅ Confirma que item 61 foi removido
- ✅ Confirma total de 60 perigos

---

### 3. Script de Correção Imediata

**Arquivo**: `fix-perigo-61-categoria.sh`

Atualizado para:
- Mostrar duplicação atual
- Remover item 61
- Verificar resultado (total = 60)

---

## 📋 Estrutura Final do Catálogo (60 Perigos)

### Biomecânicos (1-16): 16 perigos
1. Postura de pé por longos períodos
2. Postura sentada por longos períodos
... (até 16)

### Mobiliário/Equipamentos (17-33): 17 perigos
17. Equipamentos ou mobiliários não adaptados...
18. Mobiliário ou equipamento sem espaço...
... (até 33)

### Organização/Cognitivo/Psicossocial (34-52): 19 perigos
34. Excesso de situações de estresse
35. Situações de sobrecarga de trabalho mental
36. Exigência de alto nível de concentração, atenção e memória
**37. Trabalho em condições de difícil comunicação** ✅
38. Excesso de conflitos hierárquicos no trabalho
... (até 52)

### Condições Físicas/Ambientais (53-60): 8 perigos
53. Condições de trabalho com iluminação diurna inadequada
54. Condições de trabalho com iluminação noturna inadequada
55. Condições de trabalho com índice de temperatura efetiva fora dos parâmetros
56. Condições de trabalho com níveis de pressão sonora fora dos parâmetros
57. Condições de trabalho com umidade do ar fora dos parâmetros
58. Condições de trabalho com velocidade do ar fora dos parâmetros
59. Presença de reflexos em telas, painéis, vidros, monitores...
60. Piso escorregadio e/ou irregular

**Total**: 16 + 17 + 19 + 8 = **60 perigos**

---

## 🚀 Como Aplicar a Correção

### Opção 1: Script Interativo (Recomendado)

No servidor:

```bash
bash fix-perigo-61-categoria.sh
```

**O script vai**:
1. ✅ Mostrar total atual de perigos
2. ✅ Mostrar duplicação (itens 37 e 61)
3. ✅ Solicitar confirmação
4. ✅ Remover item 61
5. ✅ Verificar resultado (60 perigos)

---

### Opção 2: Migration Completa

```bash
bash run-migrations-simple.sh
```

Migration 013 será executada e removerá a duplicação.

---

### Opção 3: SQL Manual

```bash
POSTGRES_CONTAINER=$(docker ps --filter "name=ergonomia_postgres" --format "{{.Names}}" | grep -v backup | head -1)

docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
DELETE FROM perigos_catalogo
WHERE numero = 61
  AND descricao = 'Trabalho em condições de difícil comunicação';
"
```

---

## 🧪 Verificação

### Antes da Correção

```sql
SELECT COUNT(*) as total FROM perigos_catalogo;
-- Resultado: 61

SELECT numero, categoria, descricao
FROM perigos_catalogo
WHERE descricao = 'Trabalho em condições de difícil comunicação'
ORDER BY numero;
-- Resultado: 2 linhas (37 e 61)
```

### Após a Correção

```sql
SELECT COUNT(*) as total FROM perigos_catalogo;
-- Resultado: 60

SELECT numero, categoria, descricao
FROM perigos_catalogo
WHERE descricao = 'Trabalho em condições de difícil comunicação'
ORDER BY numero;
-- Resultado: 1 linha (apenas 37)
```

---

## 📊 Contagem por Categoria

### Antes

```
Biomecânicos: 16 perigos
Mobiliário/Equipamentos: 17 perigos
Organização/Cognitivo/Psicossocial: 19 perigos (item 37)
Condições Físicas/Ambientais: 9 perigos (incluindo item 61 duplicado)
Total: 61 perigos
```

### Depois

```
Biomecânicos: 16 perigos
Mobiliário/Equipamentos: 17 perigos
Organização/Cognitivo/Psicossocial: 19 perigos (item 37 mantido)
Condições Físicas/Ambientais: 8 perigos (item 61 removido)
Total: 60 perigos
```

---

## ⚠️ Impacto da Correção

### ✅ O que VAI mudar

1. **Catálogo de perigos**: Total passa de 61 para 60
2. **Item 61**: Não existirá mais no catálogo
3. **Novas avaliações**: Não terão mais o item 61 duplicado

### 🔒 O que NÃO vai mudar

1. **Item 37**: Permanece inalterado
2. **Avaliações existentes**: Se já têm o item 61, dados são preservados
3. **Numeração**: Perigos vão de 1 a 60 (sem renumeração)

---

## 📋 Checklist de Verificação

Após aplicar a correção:

- [ ] Total de perigos é 60
- [ ] Item 37 existe e está em "Organização/Cognitivo/Psicossocial"
- [ ] Item 61 NÃO existe no catálogo
- [ ] Query por "difícil comunicação" retorna apenas 1 resultado (item 37)
- [ ] Categoria "Condições Físicas/Ambientais" tem 8 perigos (53-60)
- [ ] Interface mostra perigos de 1 a 60
- [ ] Novas avaliações não mostram item 61

---

## ✅ Resumo

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Total de perigos** | 61 | 60 |
| **Item 37** | Existe (correto) | Existe (mantido) ✅ |
| **Item 61** | Existe (duplicado) ❌ | Removido ✅ |
| **Duplicação** | Sim | Não ✅ |
| **Numeração** | 1-61 (com gap) | 1-60 (sequencial) ✅ |

---

## 🔄 Arquivos Atualizados

1. ✅ `backend/migrations/008_seed_perigos_catalogo.sql` - Removido item 61
2. ✅ `backend/migrations/013_fix_perigo_61_categoria.sql` - Migration para remover
3. ✅ `fix-perigo-61-categoria.sh` - Script de correção atualizado
4. ✅ `run-migrations-simple.sh` - Migration 013 adicionada
5. ✅ `CORRECAO_PERIGO_DUPLICADO.md` - Esta documentação

---

**Pronto para aplicar!** 🚀

Execute: `bash fix-perigo-61-categoria.sh`
