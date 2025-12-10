# Melhorias no Sistema de Auditoria

## Problema Identificado

O sistema estava gerando o erro:
```
Erro ao registrar auditoria: error: relation "auditoria_log" does not exist
code: '42P01'
```

**Causas**:
1. ❌ Tabela `auditoria_log` não existia no banco de dados
2. ❌ Estrutura da tabela no middleware não correspondia à migration
3. ❌ Logs de erro muito verbosos e sem contexto útil

---

## Soluções Implementadas

### 1. Migration 012 - Criar Tabela de Auditoria

**Arquivo**: `backend/migrations/012_create_auditoria_log.sql`

**Estrutura da tabela**:
```sql
CREATE TABLE IF NOT EXISTS auditoria_log (
  id SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  acao VARCHAR(50) NOT NULL,              -- CREATE, READ, UPDATE, DELETE, LOGIN
  recurso VARCHAR(100) NOT NULL,          -- usuarios, avaliacoes, setores, etc
  metodo VARCHAR(10) NOT NULL,            -- GET, POST, PUT, DELETE
  endpoint VARCHAR(255) NOT NULL,         -- /api/avaliacoes, etc
  status_code INTEGER,                    -- 200, 201, 400, 500, etc
  ip_address VARCHAR(45),                 -- IPv4 ou IPv6
  user_agent TEXT,                        -- Navegador/cliente
  request_body JSONB,                     -- Dados enviados (POST/PUT/PATCH)
  response_body JSONB,                    -- Dados retornados (sucesso)
  erro TEXT,                              -- Mensagem de erro (falha)
  duracao_ms INTEGER,                     -- Tempo de execução em ms
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Índices para performance**:
- `idx_auditoria_usuario_id` - Consultas por usuário
- `idx_auditoria_empresa_id` - Consultas por empresa
- `idx_auditoria_acao` - Filtrar por tipo de ação
- `idx_auditoria_created_at` - Ordenação por data
- `idx_auditoria_endpoint` - Rastreamento de endpoints específicos

### 2. Atualização do Middleware de Auditoria

**Arquivo**: `backend/src/middlewares/auditLog.js`

#### Melhorias Implementadas:

**a) Estrutura compatível com migration 012**
```javascript
// ANTES: Colunas incorretas
(tabela, operacao, registro_id, usuario_id, empresa_id, dados_novos, ip_address, user_agent)

// DEPOIS: Colunas corretas
(usuario_id, empresa_id, acao, recurso, metodo, endpoint, status_code,
 ip_address, user_agent, request_body, response_body, erro, duracao_ms)
```

**b) Mapeamento adequado de ações**
```javascript
const getAcao = (method, recurso) => {
  const acaoMap = {
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE',
    'GET': 'READ'
  };
  return acaoMap[method] || 'UNKNOWN';
};
```

**c) Captura de tempo de execução**
```javascript
const startTime = Date.now();
// ... requisição executada ...
const duracao_ms = Date.now() - startTime;
```

**d) Separação de request/response/erro**
```javascript
request_body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : null,
response_body: res.statusCode < 400 ? data : null,
erro: res.statusCode >= 400 ? JSON.stringify(data) : null,
```

**e) Logs de erro mais informativos**
```javascript
if (error.code === '42P01') {
  // Erro específico: tabela não existe
  console.error('⚠️  [Auditoria] Tabela auditoria_log não existe. Execute a migration 012.');
} else {
  // Outros erros com contexto
  console.error('❌ [Auditoria] Erro ao registrar:', {
    erro: error.message,
    code: error.code,
    recurso: recurso,
    endpoint: req.originalUrl
  });
}
```

### 3. Atualização do Script de Migrations

**Arquivo**: `run-migrations-simple.sh`

Adicionada migration 012 à lista:
```bash
migrations=(
    ...
    "011_fix_perigos_inicial_null.sql"
    "012_create_auditoria_log.sql"  # ← NOVA
)
```

---

## Instruções de Deploy

### Passo 1: Executar Migration 012

No servidor, execute:

```bash
cd /caminho/para/ergonomia
bash run-migrations-simple.sh
```

**O que vai acontecer**:
- ✅ Script vai copiar migrations para o container PostgreSQL
- ✅ Vai executar migration 012 criando a tabela `auditoria_log`
- ✅ Vai criar os 5 índices para otimizar consultas

**Saída esperada**:
```
➜ Migration 012: 012_create_auditoria_log
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
COMMENT
✅ Migration 012 concluída
```

### Passo 2: Rebuild e Deploy do Backend

```bash
# Build da imagem do backend
docker build -t ergonomia-backend:latest ./backend

# Deploy no Swarm
docker stack deploy -c docker-compose.swarm.yml ergonomia

# Verificar logs
docker service logs ergonomia_backend --tail 50 -f
```

### Passo 3: Verificar Funcionamento

**a) Verificar se a tabela foi criada:**
```bash
POSTGRES_CONTAINER=$(docker ps --filter "name=ergonomia_postgres" --format "{{.Names}}" | grep -v backup | head -1)

docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "\d auditoria_log"
```

**b) Fazer uma requisição e verificar registro:**
```bash
# No navegador, faça login ou acesse qualquer página

# Verificar logs de auditoria
docker exec -e PGPASSWORD="$DB_PASSWORD" $POSTGRES_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT id, acao, recurso, metodo, endpoint, status_code, duracao_ms, created_at
FROM auditoria_log
ORDER BY created_at DESC
LIMIT 10;
"
```

---

## Benefícios das Melhorias

### 1. Logs Mais Limpos e Úteis

**ANTES**:
```
Erro ao registrar auditoria: error: relation "auditoria_log" does not exist
  at Parser.parseErrorMessage (/app/node_modules/pg-protocol/dist/parser.js:287:98)
  at Parser.handlePacket (/app/node_modules/pg-protocol/dist/parser.js:126:29)
  ... (50 linhas de stack trace)
```

**DEPOIS**:
```
⚠️  [Auditoria] Tabela auditoria_log não existe. Execute a migration 012.
```

OU (outros erros):
```
❌ [Auditoria] Erro ao registrar: {
  erro: 'column "tabela" does not exist',
  code: '42703',
  recurso: 'avaliacoes',
  endpoint: '/api/avaliacoes/123'
}
```

### 2. Rastreamento Completo de Ações

Agora você pode:

**a) Ver todas as ações de um usuário:**
```sql
SELECT acao, recurso, endpoint, created_at
FROM auditoria_log
WHERE usuario_id = 'UUID-DO-USUARIO'
ORDER BY created_at DESC;
```

**b) Monitorar performance de endpoints:**
```sql
SELECT endpoint, AVG(duracao_ms) as tempo_medio, COUNT(*) as total_chamadas
FROM auditoria_log
GROUP BY endpoint
ORDER BY tempo_medio DESC;
```

**c) Detectar erros frequentes:**
```sql
SELECT endpoint, status_code, COUNT(*) as total_erros
FROM auditoria_log
WHERE status_code >= 400
GROUP BY endpoint, status_code
ORDER BY total_erros DESC;
```

**d) Auditoria por empresa:**
```sql
SELECT e.nome, COUNT(*) as total_acoes,
       COUNT(*) FILTER (WHERE a.acao = 'CREATE') as criações,
       COUNT(*) FILTER (WHERE a.acao = 'UPDATE') as atualizações,
       COUNT(*) FILTER (WHERE a.acao = 'DELETE') as exclusões
FROM auditoria_log a
JOIN empresas e ON a.empresa_id = e.id
WHERE a.created_at > NOW() - INTERVAL '7 days'
GROUP BY e.id, e.nome;
```

### 3. Separação de Dados

- **request_body**: Captura apenas POST/PUT/PATCH (criação/atualização)
- **response_body**: Armazena resposta apenas se sucesso (status < 400)
- **erro**: Armazena mensagem de erro apenas se falha (status >= 400)

Isso economiza espaço no banco e facilita análise.

### 4. Performance Tracking

O campo `duracao_ms` permite identificar endpoints lentos:

```sql
-- Top 10 endpoints mais lentos
SELECT endpoint, AVG(duracao_ms) as tempo_medio
FROM auditoria_log
WHERE duracao_ms IS NOT NULL
GROUP BY endpoint
ORDER BY tempo_medio DESC
LIMIT 10;
```

---

## Próximos Passos Sugeridos

### 1. Limpeza Automática de Logs Antigos

Criar uma migration para adicionar rotina de limpeza:

```sql
-- Deletar logs com mais de 90 dias
DELETE FROM auditoria_log
WHERE created_at < NOW() - INTERVAL '90 days';
```

Pode ser agendado via cron job:
```bash
0 2 * * * docker exec postgres_container psql -U user -d db -c "DELETE FROM auditoria_log WHERE created_at < NOW() - INTERVAL '90 days';"
```

### 2. Criar View para Relatórios

```sql
CREATE VIEW vw_auditoria_resumo AS
SELECT
  DATE(created_at) as data,
  empresa_id,
  acao,
  recurso,
  COUNT(*) as total,
  AVG(duracao_ms) as tempo_medio_ms,
  COUNT(*) FILTER (WHERE status_code >= 400) as total_erros
FROM auditoria_log
GROUP BY DATE(created_at), empresa_id, acao, recurso;
```

### 3. Adicionar Endpoint de Auditoria na API

```javascript
// GET /api/auditoria
router.get('/auditoria', authMiddleware, async (req, res) => {
  const { dataInicio, dataFim, acao, recurso } = req.query;

  const result = await pool.query(`
    SELECT id, acao, recurso, metodo, endpoint, status_code, duracao_ms, created_at
    FROM auditoria_log
    WHERE empresa_id = $1
      AND created_at BETWEEN $2 AND $3
      ${acao ? 'AND acao = $4' : ''}
      ${recurso ? 'AND recurso = $5' : ''}
    ORDER BY created_at DESC
    LIMIT 100
  `, [req.user.empresa_id, dataInicio, dataFim, acao, recurso]);

  res.json(result.rows);
});
```

### 4. Dashboard de Auditoria no Frontend

Criar uma página em `frontend/src/pages/Auditoria.jsx` para visualizar:
- Últimas ações realizadas
- Gráfico de ações por tipo
- Endpoints mais acessados
- Performance por endpoint
- Taxa de erro por endpoint

---

## Checklist de Verificação

Após o deploy, verifique:

- [ ] Migration 012 executada com sucesso
- [ ] Tabela `auditoria_log` existe no banco
- [ ] 5 índices foram criados
- [ ] Backend foi rebuildado com novo middleware
- [ ] Logs de erro estão mais limpos (sem stack trace gigante)
- [ ] Requisições estão sendo registradas na tabela
- [ ] Campo `duracao_ms` está sendo populado
- [ ] Logs não estão bloqueando requisições (async)

---

## Troubleshooting

### Se migration 012 falhar com "table already exists"

A migration usa `CREATE TABLE IF NOT EXISTS`, então é seguro rodar múltiplas vezes.

### Se logs continuarem aparecendo após migration

1. Verificar se backend foi rebuildado:
```bash
docker service ps ergonomia_backend
```

2. Forçar rebuild se necessário:
```bash
docker service update --force ergonomia_backend
```

### Se auditoria não estiver registrando

1. Verificar se middleware está aplicado nas rotas:
```javascript
router.post('/avaliacoes', authMiddleware, auditLog('avaliacoes'), avaliacoesController.create);
```

2. Verificar logs do backend:
```bash
docker service logs ergonomia_backend --tail 100 | grep Auditoria
```
