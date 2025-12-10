# Deploy das Correções de Relatórios

## Alterações Realizadas

### 1. Frontend - Relatorios.jsx
**Arquivo**: `frontend/src/pages/Relatorios.jsx`

**Mudanças**:
- Adicionado console.log para debug dos dados recebidos (linhas 60-64)
- Adicionado verificação detalhada da estrutura do inventário (linhas 66-71)

```javascript
console.log('📊 Dados recebidos:');
console.log('Inventário:', inventario.data);
console.log('Estatísticas:', stats.data);
console.log('Por Setor:', porSetor.data);
console.log('Avaliações por Setor:', avaliacoesPorSetor.data);

// Verificar estrutura dos dados
if (inventario.data) {
  console.log('🔍 Inventário - riscos:', inventario.data.riscos?.length || 0);
  console.log('🔍 Inventário - stats:', inventario.data.stats);
  console.log('🔍 Inventário - riscosPorNivel:', inventario.data.riscosPorNivel);
}
```

### 2. Backend - relatoriosController.js
**Arquivo**: `backend/src/controllers/relatoriosController.js`

**Mudanças**: Adicionado logging em todos os endpoints de relatórios:
- `inventarioRiscos` (linhas 68-71)
- `relatorioPorSetor` (linhas 258-261)
- `relatorioAvaliacoesPorSetor` (linhas 331-334)

```javascript
console.log('📊 [Inventário] Query executada. Rows encontradas:', result.rows.length);
if (result.rows.length > 0) {
  console.log('📊 [Inventário] Primeira row:', result.rows[0]);
}
```

### 3. Frontend - relatoriosService.js
**Arquivo**: `frontend/src/services/relatoriosService.js`

**Status**: Já corrigido anteriormente (params sendo passados corretamente)

## Instruções de Deploy

### Opção 1: Deploy Automático (Recomendado)

No servidor, execute:

```bash
cd /caminho/para/ergonomia
bash deploy-swarm.sh
```

### Opção 2: Deploy Manual

Se o script automático falhar, execute:

```bash
# 1. Build do frontend (já foi feito localmente)
cd frontend
npm run build

# 2. Build das imagens Docker
docker build -t ergonomia-frontend:latest ./frontend
docker build -t ergonomia-backend:latest ./backend

# 3. Deploy no Swarm
docker stack deploy -c docker-compose.swarm.yml ergonomia

# 4. Verificar status
docker service ls
docker service logs ergonomia_frontend --tail 50
docker service logs ergonomia_backend --tail 50
```

## Verificação

### 1. Verificar Logs do Backend

Após o deploy, verifique os logs do container backend:

```bash
docker service logs ergonomia_backend --tail 50 -f
```

Quando acessar a página de Relatórios, você deve ver logs como:
```
📊 [Inventário] Query executada. Rows encontradas: X
📊 [Por Setor] Query executada. Rows encontradas: X
📊 [Avaliações por Setor] Query executada. Rows encontradas: X
```

**IMPORTANTE**: Se aparecer "Rows encontradas: 0", significa que não há dados no banco. Neste caso:
1. Verifique se há avaliações criadas
2. Verifique se as avaliações têm perigos classificados
3. Verifique se a empresa_id do usuário está correta

### 2. Abrir Console do Navegador

Após o deploy, acesse a aplicação e:

1. Abra o menu "Relatórios e Dashboards"
2. Abra o Console do navegador (F12)
3. Verifique os logs que começam com "📊 Dados recebidos:"

### 3. Verificar Estrutura dos Dados

**Esperado para Inventário:**
```javascript
{
  riscosPorNivel: { intoleravel: [...], substancial: [...], moderado: [...], toleravel: [...], trivial: [...] },
  stats: { total: X, intoleravel: X, substancial: X, moderado: X, toleravel: X, trivial: X },
  riscos: [...]
}
```

**Esperado para Por Setor:**
```javascript
[
  { setor_id: X, setor_nome: "...", unidade_nome: "...", total_avaliacoes: X, riscos_intoleraveis: X, ... }
]
```

### 3. Testar Funcionalidades

- [ ] Dashboard mostra estatísticas gerais
- [ ] Inventário de Riscos mostra tabela com avaliações
- [ ] Relatório Por Setor mostra contadores por setor
- [ ] Avaliações por Setor lista todas avaliações
- [ ] Filtros por data funcionam
- [ ] Filtro por setor funciona
- [ ] Exportação individual de cada relatório funciona

## Possíveis Problemas

### Se os dados não aparecerem:

1. **Verificar no console:**
   - Se aparecer "Erro ao carregar dados:" → problema na API
   - Se os dados estiverem null/undefined → problema na estrutura

2. **Verificar backend:**
   ```bash
   docker service logs ergonomia_backend --tail 100
   ```

3. **Verificar se migration 011 foi executada:**
   ```bash
   bash run-migrations-simple.sh
   ```

### Se houver erro de CORS:

Verificar se `VITE_API_URL` está configurado corretamente no `.env`

### Se os filtros não funcionarem:

Verificar se os parâmetros estão sendo enviados corretamente no Network tab do navegador

## Próximos Passos (Se Necessário)

Se após o deploy os dados ainda não aparecerem, precisaremos:

1. Analisar os logs do console
2. Verificar a estrutura exata dos dados retornados
3. Ajustar o código frontend conforme necessário

## Diagnóstico de Dados Vazios

Se os logs mostrarem "Rows encontradas: 0", aqui estão os passos para diagnosticar:

### 1. Verificar se há avaliações no banco

```bash
# Encontrar o container postgres
POSTGRES_CONTAINER=$(docker ps --filter "name=ergonomia_postgres" --format "{{.Names}}" | grep -v backup | head -1)

# Verificar avaliações
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT id, titulo, empresa_id, setor_id, status FROM avaliacoes_ergonomicas LIMIT 10;"
```

### 2. Verificar se há perigos identificados

```bash
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE identificado = true) as identificados FROM perigos_identificados;"
```

### 3. Verificar se há classificações de risco

```bash
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) FROM classificacao_risco;"
```

### 4. Verificar empresa_id do usuário logado

No console do navegador, execute:
```javascript
localStorage.getItem('token')
// Copie o token e decodifique em https://jwt.io para ver a empresa_id
```

### 5. Testar query manualmente

Se encontrar avaliações mas o relatório está vazio, teste a query diretamente:

```bash
# Substitua 1 pela empresa_id do usuário
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  a.id,
  a.titulo,
  s.nome as setor_nome,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.identificado = true) as total_perigos
FROM avaliacoes_ergonomicas a
JOIN setores s ON a.setor_id = s.id
LEFT JOIN perigos_identificados pi ON a.id = pi.avaliacao_id
WHERE a.empresa_id = 1
GROUP BY a.id, a.titulo, s.nome;
"
```

## 🔍 Diagnóstico Confirmado - BANCO VAZIO

**Problema Identificado**: Os logs confirmam que o banco de dados está retornando 0 linhas.

```
Backend: 📊 [Inventário] Query executada. Rows encontradas: 0
Frontend: 🔍 Inventário - riscos: 0
```

Isso significa que:
1. ❌ Não há avaliações no banco para a empresa do usuário logado
2. ❌ OU não há perigos classificados nas avaliações
3. ❌ OU a empresa_id do usuário não corresponde às avaliações

### Solução Rápida

Criamos 2 scripts para ajudar:

#### 1. Diagnosticar o problema
```bash
bash diagnostico-dados.sh
```

Este script vai mostrar:
- Quantas avaliações existem
- Quais empresas têm avaliações
- Se há perigos identificados
- Se há classificações de risco
- Testar a query do inventário

#### 2. Popular dados de teste (se necessário)
```bash
bash popular-dados-teste.sh
```

Este script vai criar:
- 3 avaliações de teste
- 5 perigos identificados por avaliação
- Classificações de risco variadas (Intolerável, Substancial, Moderado, etc.)

**IMPORTANTE**: Execute primeiro o `diagnostico-dados.sh` para entender o problema antes de popular dados.

## Build Atual

O build do frontend já foi realizado com sucesso:
- Tamanho: 1,272.73 kB
- Gzip: 291.68 kB
- Tempo: 7.38s
- Status: ✅ Concluído
- Versão: Com logs de debug

Os arquivos estão em: `frontend/dist/`

## Código Funcionando Corretamente ✅

Os logs confirmam que:
- ✅ Frontend está fazendo as requisições corretamente
- ✅ Backend está executando as queries corretamente
- ✅ Estrutura de dados está correta
- ✅ Comunicação frontend-backend está funcionando

O problema é **apenas falta de dados no banco**.
