# Numeração por Categoria - Implementação Completa

## 🎯 Objetivo

Cada categoria de perigos terá sua própria numeração independente, começando do 1.

---

## 📊 Antes vs Depois

### ANTES (Numeração Global)

```
Biomecânicos:
  1. Postura de pé por longos períodos
  2. Postura sentada por longos períodos
  ...
  16. Necessidade de manter ritmos intensos de trabalho

Mobiliário/Equipamentos:
  17. Equipamentos ou mobiliários não adaptados...
  18. Mobiliário ou equipamento sem espaço...
  ...
  33. Cadência do trabalho imposta por um equipamento

Organização/Cognitivo/Psicossocial:
  34. Excesso de situações de estresse
  35. Situações de sobrecarga de trabalho mental
  ...
  52. Falta de autonomia

Condições Físicas/Ambientais:
  53. Condições de trabalho com iluminação diurna inadequada
  54. Condições de trabalho com iluminação noturna inadequada
  ...
  61. Piso escorregadio e/ou irregular
```

### DEPOIS (Numeração por Categoria) ✅

```
Biomecânicos (1-16):
  1. Postura de pé por longos períodos
  2. Postura sentada por longos períodos
  ...
  16. Necessidade de manter ritmos intensos de trabalho

Mobiliário/Equipamentos (1-17):
  1. Equipamentos ou mobiliários não adaptados...
  2. Mobiliário ou equipamento sem espaço...
  ...
  17. Cadência do trabalho imposta por um equipamento

Organização/Cognitivo/Psicossocial (1-19):
  1. Excesso de situações de estresse
  2. Situações de sobrecarga de trabalho mental
  ...
  19. Falta de autonomia

Condições Físicas/Ambientais (1-9):
  1. Condições de trabalho com iluminação diurna inadequada
  2. Condições de trabalho com iluminação noturna inadequada
  ...
  9. Piso escorregadio e/ou irregular
```

---

## 🚀 Como Aplicar

### No Servidor:

```bash
bash reindexar-por-categoria.sh
```

**O que o script faz**:
1. ✅ Reindexar cada categoria independentemente
2. ✅ Biomecânicos: 1-16
3. ✅ Mobiliário/Equipamentos: 1-17
4. ✅ Organização/Cognitivo/Psicossocial: 1-19
5. ✅ Condições Físicas/Ambientais: 1-9
6. ✅ Atualizar constraints do banco de dados

**Tempo**: ~30 segundos

---

## 🔧 Mudanças Técnicas

### 1. Banco de Dados

**Migration**: `backend/migrations/015_reindexar_por_categoria.sql`

```sql
-- Renumerar por categoria
ROW_NUMBER() OVER (
    PARTITION BY categoria
    ORDER BY numero
) as novo_numero

-- Constraint única: categoria + numero
ALTER TABLE perigos_catalogo
    ADD CONSTRAINT perigos_catalogo_categoria_numero_key
    UNIQUE (categoria, numero);
```

**Antes**: `numero` único globalmente
**Depois**: `(categoria, numero)` único (permite número 1 em cada categoria)

---

### 2. Backend

**Sem mudanças necessárias!**

O backend já retorna `numero` e `categoria` para cada perigo. Com a reindexação, os números virão atualizados automaticamente.

**Exemplo de resposta da API**:
```json
{
  "perigos": [
    {
      "perigo_id": "uuid",
      "numero": 1,  // ← Agora é 1 dentro da categoria
      "categoria": "Biomecânicos",
      "descricao": "Postura de pé por longos períodos"
    },
    {
      "perigo_id": "uuid",
      "numero": 1,  // ← Também é 1, mas em outra categoria
      "categoria": "Mobiliário/Equipamentos",
      "descricao": "Equipamentos ou mobiliários..."
    }
  ]
}
```

---

### 3. Frontend

**Sem mudanças necessárias!**

O componente `PreencherAvaliacao.jsx` já agrupa por categoria e mostra `perigo.numero`:

```jsx
// Linha 335
<span className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-700 rounded-full text-sm font-semibold">
  {perigo.numero}
</span>
```

Como os perigos já são agrupados por categoria no frontend, a numeração por categoria ficará automaticamente correta!

---

## 📋 Estrutura Final

| Categoria | Numeração | Total |
|-----------|-----------|-------|
| **Biomecânicos** | 1-16 | 16 perigos |
| **Mobiliário/Equipamentos** | 1-17 | 17 perigos |
| **Organização/Cognitivo/Psicossocial** | 1-19 | 19 perigos |
| **Condições Físicas/Ambientais** | 1-9 | 9 perigos |
| **TOTAL** | - | **61 perigos** |

---

## 🧪 Verificação

### No Banco de Dados

```sql
-- Ver distribuição por categoria
SELECT
    categoria,
    COUNT(*) as total,
    MIN(numero)::text || '-' || MAX(numero)::text as faixa
FROM perigos_catalogo
GROUP BY categoria;

-- Resultado esperado:
-- Biomecânicos                       | 16 | 1-16
-- Mobiliário/Equipamentos            | 17 | 1-17
-- Organização/Cognitivo/Psicossocial | 19 | 1-19
-- Condições Físicas/Ambientais       |  9 | 1-9
```

### No Frontend

1. **Acessar avaliação** em andamento
2. **Expandir cada categoria**
3. **Verificar numeração**:
   - Biomecânicos: 1, 2, 3... 16 ✅
   - Mobiliário/Equipamentos: 1, 2, 3... 17 ✅
   - Organização/Cognitivo/Psicossocial: 1, 2, 3... 19 ✅
   - Condições Físicas/Ambientais: 1, 2, 3... 9 ✅

---

## ⚠️ Impacto

### ✅ O que VAI mudar

1. **Numeração**: Cada categoria começa do 1
2. **Constraint**: Agora `(categoria, numero)` é único
3. **Visualização**: Mais intuitivo (item 1, 2, 3... em cada categoria)

### 🔒 O que NÃO muda

1. **Total de perigos**: Continua 61
2. **Descrições**: Inalteradas
3. **Categorias**: Inalteradas
4. **Backend/Frontend**: Nenhum código precisa ser alterado
5. **Avaliações existentes**: Dados preservados

---

## 📝 Arquivos Criados/Modificados

1. ✅ **backend/migrations/015_reindexar_por_categoria.sql**
   - Migration para reindexação

2. ✅ **reindexar-por-categoria.sh**
   - Script para aplicar reindexação

3. ✅ **run-migrations-simple.sh**
   - Adicionada migration 015

4. ✅ **NUMERACAO_POR_CATEGORIA.md**
   - Esta documentação

---

## 🎯 Exemplo Visual (Frontend)

```
╔═══════════════════════════════════════════════════╗
║ Biomecânicos (16 perigos)                         ║
╠═══════════════════════════════════════════════════╣
║ ① Postura de pé por longos períodos              ║
║ ② Postura sentada por longos períodos            ║
║ ③ Frequente deslocamento a pé...                 ║
║ ...                                               ║
║ ⑯ Necessidade de manter ritmos intensos          ║
╚═══════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════╗
║ Mobiliário/Equipamentos (17 perigos)              ║
╠═══════════════════════════════════════════════════╣
║ ① Equipamentos ou mobiliários não adaptados...   ║
║ ② Mobiliário ou equipamento sem espaço...        ║
║ ③ Assento inadequado                             ║
║ ...                                               ║
║ ⑰ Cadência do trabalho imposta...                ║
╚═══════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════╗
║ Organização/Cognitivo/Psicossocial (19 perigos)   ║
╠═══════════════════════════════════════════════════╣
║ ① Excesso de situações de estresse               ║
║ ② Situações de sobrecarga de trabalho mental     ║
║ ③ Exigência de alto nível de concentração...     ║
║ ...                                               ║
║ ⑲ Falta de autonomia                             ║
╚═══════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════╗
║ Condições Físicas/Ambientais (9 perigos)          ║
╠═══════════════════════════════════════════════════╣
║ ① Condições de trabalho com iluminação diurna... ║
║ ② Condições de trabalho com iluminação noturna...║
║ ③ Condições de trabalho com índice de temp...    ║
║ ...                                               ║
║ ⑨ Piso escorregadio e/ou irregular               ║
╚═══════════════════════════════════════════════════╝
```

---

## 💡 Benefícios

1. ✅ **Mais intuitivo**: Numeração reinicia em cada categoria
2. ✅ **Fácil localização**: "Item 5 da categoria Biomecânicos"
3. ✅ **Organização visual**: Cada categoria é independente
4. ✅ **Flexível**: Fácil adicionar/remover perigos por categoria
5. ✅ **Sem impacto**: Backend e Frontend não precisam ser alterados

---

## 🚀 EXECUTE AGORA

```bash
bash reindexar-por-categoria.sh
```

**Depois**:
1. Limpe o cache: **CTRL + SHIFT + R**
2. Recarregue a página
3. Verifique: cada categoria começa do 1 ✅

---

**Status**: 🟢 **PRONTO PARA EXECUÇÃO**
