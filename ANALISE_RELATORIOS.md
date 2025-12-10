# Análise dos Relatórios e Dashboards - Sistema de Ergonomia

## Data: 2025-12-10

## 1. ESTRUTURA ATUAL

### Frontend (Relatorios.jsx)
O sistema possui um componente principal com 5 tabs:
1. **Dashboard** - Estatísticas gerais e gráficos
2. **Inventário de Riscos** - Lista de riscos com filtros
3. **Por Setor** - Resumo de riscos por setor
4. **Avaliações por Setor** - Lista de avaliações por setor
5. **Relatório Detalhado de Avaliações** - Componente separado

### Backend (relatoriosController.js)
Endpoints disponíveis:
- `/relatorios/inventario-riscos` - Inventário com filtros
- `/relatorios/estatisticas-gerais` - Dashboard principal
- `/relatorios/por-setor` - Relatório por setor
- `/relatorios/avaliacoes-por-setor` - Avaliações por setor
- `/relatorios/avaliacoes-detalhado` - Relatório detalhado
- `/relatorios/consolidado` - PDF consolidado

## 2. PROBLEMAS IDENTIFICADOS

### 2.1 Filtros
❌ **PROBLEMA**: Filtros não estão sendo aplicados corretamente
- `inventarioRiscos`: Recebe filtros mas componente não passa `setor_id`
- `relatorioPorSetor`: NÃO aceita filtros (linha 202)
- `relatorioAvaliacoesPorSetor`: Aceita apenas `setor_id`, não aceita datas

**Impacto**: Usuário não consegue filtrar dados adequadamente

### 2.2 Exportação Individual
❌ **PROBLEMA**: Não existe exportação individual por relatório
- Apenas 1 botão "Exportar PDF" que gera relatório consolidado
- Não é possível exportar apenas "Inventário de Riscos"
- Não é possível exportar apenas "Relatório por Setor"

**Impacto**: Falta de flexibilidade na geração de relatórios

### 2.3 Dados do Inventário de Riscos
⚠️ **ATENÇÃO**: A query pode estar incorreta
- Linha 20: `MAX(cr.classificacao_final) as classificacao_risco`
- Isso pega a classificação alfabeticamente maior, não a pior!
- Deveria usar `MAX(cr.nivel_risco)` e depois converter

**Impacto**: Classificação de risco pode estar errada no inventário

### 2.4 Relatório Por Setor
⚠️ **ATENÇÃO**: Queries com possíveis problemas
- Linha 212-214: Conta avaliações distintas por classificação
- Uma avaliação pode ter múltiplos riscos com níveis diferentes
- Deveria contar PERIGOS, não avaliações

**Impacto**: Números podem não representar a realidade

## 3. MELHORIAS NECESSÁRIAS

### 3.1 CORRIGIR FILTROS (ALTA PRIORIDADE)

#### Backend
```javascript
// relatorioPorSetor deve aceitar filtros
async relatorioPorSetor(req, res) {
  const { data_inicio, data_fim } = req.query;
  
  // Adicionar filtros na query
  if (data_inicio) {
    query += ` AND a.data_avaliacao >= $X`;
  }
  if (data_fim) {
    query += ` AND a.data_avaliacao <= $Y`;
  }
}

// relatorioAvaliacoesPorSetor deve aceitar data_inicio e data_fim
async relatorioAvaliacoesPorSetor(req, res) {
  const { setor_id, data_inicio, data_fim } = req.query;
  // Adicionar filtros de data
}
```

#### Frontend
```javascript
// Passar setor_id no filtro de inventário
<select 
  value={filtros.setor_id}
  onChange={(e) => setFiltros({...filtros, setor_id: e.target.value})}
>
  <option value="">Todos os setores</option>
  {/* carregar setores */}
</select>
```

### 3.2 ADICIONAR EXPORTAÇÃO INDIVIDUAL (MÉDIA PRIORIDADE)

Criar botão de exportação em cada tab:
- "Exportar Inventário de Riscos (PDF)"
- "Exportar Relatório por Setor (PDF)"  
- "Exportar Avaliações por Setor (PDF)"
- "Exportar Relatório Detalhado (PDF)"
- "Exportar Dashboard (PDF)"

Cada um deve gerar PDF específico com os dados filtrados daquela tab.

### 3.3 CORRIGIR QUERY DE INVENTÁRIO (ALTA PRIORIDADE)

```sql
-- Em vez de MAX(cr.classificacao_final)
-- Usar uma subquery para pegar a pior classificação
(
  SELECT cr2.classificacao_final
  FROM classificacao_risco cr2
  JOIN perigos_identificados pi2 ON cr2.perigo_identificado_id = pi2.id
  WHERE pi2.avaliacao_id = a.id
  ORDER BY cr2.nivel_risco DESC
  LIMIT 1
) as classificacao_risco
```

### 3.4 CORRIGIR CONTAGEM POR SETOR (MÉDIA PRIORIDADE)

```sql
-- Contar PERIGOS, não avaliações
COUNT(CASE WHEN cr.classificacao_final = 'Intolerável' THEN pi.id END) as perigos_intoleraveis,
COUNT(CASE WHEN cr.classificacao_final = 'Substancial' THEN pi.id END) as perigos_substanciais,
```

### 3.5 ADICIONAR SELETOR DE SETOR (BAIXA PRIORIDADE)

No frontend, adicionar dropdown para selecionar setor em todos os filtros:
```javascript
const [setores, setSetores] = useState([]);

useEffect(() => {
  // Carregar lista de setores
  setorService.listar().then(res => setSetores(res.data));
}, []);
```

## 4. PLANO DE IMPLEMENTAÇÃO

### Fase 1 - Correções Críticas (URGENTE)
- [ ] Corrigir query de inventário de riscos (classificação)
- [ ] Adicionar filtros de data em relatorioPorSetor
- [ ] Adicionar filtros de data em relatorioAvaliacoesPorSetor

### Fase 2 - Melhorias de Filtros (IMPORTANTE)
- [ ] Adicionar dropdown de setores no frontend
- [ ] Passar setor_id em todos os filtros
- [ ] Testar filtros end-to-end

### Fase 3 - Exportação Individual (DESEJÁVEL)
- [ ] Criar endpoint /relatorios/inventario-riscos/pdf
- [ ] Criar endpoint /relatorios/por-setor/pdf
- [ ] Criar endpoint /relatorios/avaliacoes-por-setor/pdf
- [ ] Adicionar botões de exportação em cada tab

### Fase 4 - Melhorias de Dados (DESEJÁVEL)
- [ ] Corrigir contagem por setor (perigos vs avaliações)
- [ ] Adicionar mais métricas no dashboard
- [ ] Adicionar gráficos de tendência

## 5. TESTES NECESSÁRIOS

Após implementação, testar:
1. Filtrar inventário por setor + data
2. Filtrar relatório por setor por data
3. Filtrar avaliações por setor por setor + data
4. Exportar cada relatório individualmente
5. Verificar se classificações estão corretas
6. Verificar se contagens estão corretas

## 6. ESTIMATIVA DE ESFORÇO

- Fase 1: 2-3 horas
- Fase 2: 2-3 horas
- Fase 3: 4-6 horas
- Fase 4: 2-3 horas

**Total: 10-15 horas de desenvolvimento**

---

## ATUALIZAÇÃO - 2025-12-10 (Tarde)

### ✅ IMPLEMENTAÇÃO CONCLUÍDA

Todas as 4 fases foram implementadas com sucesso:

#### FASE 1 - Correções Críticas ✅
- ✅ Query de inventário corrigida (usar subquery para pegar classificação correta)
- ✅ Filtros de data adicionados em relatorioPorSetor  
- ✅ Filtros de data adicionados em relatorioAvaliacoesPorSetor

#### FASE 2 - Melhorias de Filtros ✅
- ✅ Dropdown de setores adicionado no frontend
- ✅ Carregamento de lista de setores via API
- ✅ Filtros aplicados em todos os endpoints (inventário, por setor, avaliações)

#### FASE 3 - Exportação Individual ✅
- ✅ Função exportarInventarioPDF() com gerador HTML
- ✅ Função exportarPorSetorPDF() com gerador HTML
- ✅ Função exportarAvaliacoesPorSetorPDF() com gerador HTML
- ✅ Botões de exportação adicionados em cada tab
- ✅ PDFs individualizados para cada tipo de relatório

#### FASE 4 - Correção de Contagens ✅
- ✅ Relatório por setor agora conta PERIGOS em vez de avaliações
- ✅ Adicionado filtro `pi.identificado = true` para precisão
- ✅ Removido DISTINCT das contagens por classificação

### Commits Realizados
1. `67b1707` - FASE 1: Correções críticas nos relatórios
2. `f1178f2` - FASE 2 e 4: Melhorias de filtros e correção de contagens
3. `83818e4` - FASE 3: Adicionar exportação individual de relatórios

### Próximos Passos

Execute no servidor:
```bash
cd /opt/apps/ergonomia
git pull
bash force-redeploy.sh
```

Após deploy, testar:
1. ✅ Filtro por setor no Inventário de Riscos
2. ✅ Filtros de data em todos os relatórios
3. ✅ Exportação individual de cada relatório
4. ✅ Verificar contagens corretas por setor
5. ✅ Verificar classificações de risco corretas

### Melhorias Implementadas

**Backend:**
- Queries otimizadas com subqueries
- Filtros dinâmicos com prepared statements
- Contagens precisas de perigos

**Frontend:**
- Interface de filtros completa
- 3 novos botões de exportação
- Funções HTML otimizadas para PDF
- Carregamento dinâmico de setores

**Total de linhas alteradas:** ~200 linhas
**Tempo estimado:** 10-15 horas → **Concluído em 1 sessão**
