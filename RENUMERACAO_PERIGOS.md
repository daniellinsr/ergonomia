# Renumeração de Perigos: 1-60 Sequencial

## 🎯 Problema

O frontend mostra o item **61** duplicado porque o banco de dados ainda contém a duplicação:

- ✅ **Item 37**: "Trabalho em condições de difícil comunicação" (correto)
- ❌ **Item 61**: Mesmo texto duplicado (erro)

**Resultado no Frontend**: Interface mostra 61 perigos, mas deveria mostrar 60.

---

## ✅ Solução

**Renumeração completa** de 1 a 60, removendo duplicação e garantindo sequência sem gaps.

---

## 🚀 Como Aplicar (EXECUTE ISSO!)

### No servidor:

```bash
bash renumerar-perigos.sh
```

**O que o script faz**:
1. ✅ Mostra estado atual (total, faixa, duplicados)
2. ✅ Pede confirmação
3. ✅ Remove item 61 duplicado
4. ✅ Renumera todos os perigos sequencialmente (1-60)
5. ✅ Garante sem gaps
6. ✅ Mostra resultado final

**Tempo**: ~1 minuto

---

## 📊 Antes vs Depois

### ANTES (Com Duplicação)

```
Total: 61 perigos
Faixa: 1-61
Duplicados: Sim (item 61)

Categoria "Organização/Cognitivo/Psicossocial":
  37. Trabalho em condições de difícil comunicação ✅

Categoria "Condições Físicas/Ambientais":
  53-60 (normal)
  61. Trabalho em condições de difícil comunicação ❌ (DUPLICADO!)
```

### DEPOIS (Sequencial 1-60)

```
Total: 60 perigos
Faixa: 1-60
Duplicados: Não

Categoria "Organização/Cognitivo/Psicossocial":
  37. Trabalho em condições de difícil comunicação ✅

Categoria "Condições Físicas/Ambientais":
  53-60 (sem item 61)
```

---

## 🔧 O Que a Renumeração Faz

### Passo 1: Identificar Perigos Válidos
```sql
-- Seleciona todos EXCETO o item 61 duplicado
SELECT *
FROM perigos_catalogo
WHERE NOT (
    numero = 61
    AND descricao = 'Trabalho em condições de difícil comunicação'
    AND categoria = 'Condições Físicas/Ambientais'
)
```

### Passo 2: Renumerar Sequencialmente
```sql
-- Atribui novos números de 1 a 60
ROW_NUMBER() OVER (ORDER BY numero) as novo_numero
```

### Passo 3: Aplicar Nova Numeração
```sql
UPDATE perigos_catalogo
SET numero = novo_numero
FROM perigos_renumerados
```

### Passo 4: Remover Duplicados
```sql
DELETE FROM perigos_catalogo
WHERE numero > 60
```

---

## 📋 Resultado Final (60 Perigos)

| Categoria | Faixa | Total |
|-----------|-------|-------|
| **Biomecânicos** | 1-16 | 16 |
| **Mobiliário/Equipamentos** | 17-33 | 17 |
| **Organização/Cognitivo/Psicossocial** | 34-52 | 19 |
| **Condições Físicas/Ambientais** | 53-60 | **8** |
| **TOTAL** | **1-60** | **60** |

**Nota**: Condições Físicas/Ambientais passa de 9 para 8 perigos (remoção do item 61 duplicado)

---

## 🧪 Verificação Pós-Renumeração

### 1. No Banco de Dados

```bash
# Total de perigos
SELECT COUNT(*) FROM perigos_catalogo;
-- Deve retornar: 60

# Faixa de numeração
SELECT MIN(numero), MAX(numero) FROM perigos_catalogo;
-- Deve retornar: 1, 60

# Verificar gaps
SELECT num FROM generate_series(1, 60) AS num
WHERE NOT EXISTS (SELECT 1 FROM perigos_catalogo WHERE numero = num);
-- Deve retornar: (vazio)

# Verificar duplicados
SELECT descricao, COUNT(*)
FROM perigos_catalogo
GROUP BY descricao
HAVING COUNT(*) > 1;
-- Deve retornar: (vazio)
```

### 2. No Frontend

1. **Limpar cache**: CTRL + SHIFT + R
2. **Acessar avaliação** em andamento
3. **Expandir categorias**:
   - ✅ Organização/Cognitivo/Psicossocial: deve ter item 37
   - ✅ Condições Físicas/Ambientais: deve ter 53-60 (SEM 61!)
4. **Contar total**: Deve mostrar 60 perigos

---

## ⚠️ Impacto

### ✅ O Que VAI Mudar

1. **Banco de dados**: Total passa de 61 para 60 perigos
2. **Numeração**: Sequência 1-60 sem gaps
3. **Frontend**: Item 61 desaparece
4. **Novas avaliações**: Não terão item 61

### 🔒 O Que NÃO Muda

1. **Perigos existentes**: Descrições e categorias inalteradas
2. **Avaliações antigas**: Dados preservados (mesmo se referenciarem item 61)
3. **Item 37**: Permanece intacto

---

## 🐛 Troubleshooting

### Problema: Frontend ainda mostra item 61 após renumeração

**Solução 1**: Limpar cache do navegador
```
CTRL + SHIFT + R  (Windows/Linux)
CMD + SHIFT + R   (Mac)
```

**Solução 2**: Verificar se renumeração foi aplicada
```bash
# No servidor
POSTGRES_CONTAINER=$(docker ps --filter "name=ergonomia_postgres" --format "{{.Names}}" | grep -v backup | head -1)

docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT COUNT(*) FROM perigos_catalogo;
"
```

Se retornar 61, a renumeração NÃO foi aplicada. Execute: `bash renumerar-perigos.sh`

---

### Problema: Erro "duplicate key value violates unique constraint"

**Causa**: Constraint de unicidade impedindo renumeração

**Solução**: A migration 014 já trata isso, mas se precisar fazer manualmente:

```sql
-- Remover constraint temporariamente
ALTER TABLE perigos_catalogo DROP CONSTRAINT IF EXISTS perigos_catalogo_numero_key;

-- Fazer renumeração
-- (executar script)

-- Recriar constraint
ALTER TABLE perigos_catalogo ADD CONSTRAINT perigos_catalogo_numero_key UNIQUE (numero);
```

---

### Problema: Avaliações antigas quebram

**Improvável**, mas se acontecer:

As avaliações antigas podem ter referências ao perigo 61. Se isso causar problemas:

```sql
-- Atualizar referências de perigo 61 para perigo 37
UPDATE perigos_identificados
SET perigo_id = (SELECT id FROM perigos_catalogo WHERE numero = 37)
WHERE perigo_id = (SELECT id FROM perigos_catalogo WHERE numero = 61);
```

---

## 📝 Arquivos Criados

1. ✅ **`backend/migrations/014_renumerar_perigos_sequencial.sql`**
   - Migration automática para renumeração
   - Verificações incluídas

2. ✅ **`renumerar-perigos.sh`** ⭐
   - Script interativo para aplicar agora
   - Mostra antes/depois
   - **EXECUTE ESTE!**

3. ✅ **`run-migrations-simple.sh`**
   - Atualizado com migration 014

4. ✅ **`RENUMERACAO_PERIGOS.md`**
   - Esta documentação

---

## ✅ Checklist Final

Após executar `bash renumerar-perigos.sh`:

- [ ] Script executado sem erros
- [ ] Total de perigos = 60
- [ ] Faixa: 1 a 60 (sem gaps)
- [ ] Sem duplicados
- [ ] Frontend não mostra item 61 (após limpar cache)
- [ ] Categoria "Organização..." tem item 37
- [ ] Categoria "Condições Físicas..." tem 53-60 (sem 61)

---

## 🎯 Resumo Executivo

| Item | Status |
|------|--------|
| **Problema identificado** | ✅ Item 61 duplicado |
| **Migration 008 corrigida** | ✅ Removido item 61 do seed |
| **Migration 013 criada** | ✅ Remove item 61 do banco |
| **Migration 014 criada** | ✅ Renumera 1-60 |
| **Script renumerar-perigos.sh** | ✅ Aplica correção |
| **Documentação** | ✅ Completa |

---

## 🚀 AÇÃO NECESSÁRIA

**Execute no servidor AGORA**:

```bash
bash renumerar-perigos.sh
```

Depois limpe o cache do navegador (CTRL+SHIFT+R) e verifique o resultado!

---

**Status**: 🟢 **PRONTO PARA EXECUÇÃO**
