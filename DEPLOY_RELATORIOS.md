# Deploy das Correções de Relatórios

## Alterações Realizadas

### 1. Frontend - Relatorios.jsx
**Arquivo**: `frontend/src/pages/Relatorios.jsx`

**Mudança**: Adicionado console.log para debug dos dados recebidos (linhas 60-64)

```javascript
console.log('📊 Dados recebidos:');
console.log('Inventário:', inventario.data);
console.log('Estatísticas:', stats.data);
console.log('Por Setor:', porSetor.data);
console.log('Avaliações por Setor:', avaliacoesPorSetor.data);
```

### 2. Frontend - relatoriosService.js
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

### 1. Abrir Console do Navegador

Após o deploy, acesse a aplicação e:

1. Abra o menu "Relatórios e Dashboards"
2. Abra o Console do navegador (F12)
3. Verifique os logs que começam com "📊 Dados recebidos:"

### 2. Verificar Estrutura dos Dados

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

## Build Atual

O build do frontend já foi realizado com sucesso:
- Tamanho: 1,272.51 kB
- Gzip: 291.61 kB
- Tempo: 7.77s
- Status: ✅ Concluído

Os arquivos estão em: `frontend/dist/`
