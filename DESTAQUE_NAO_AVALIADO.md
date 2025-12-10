# Destaque Visual para "Não Avaliado"

## Alteração Realizada

Adicionado destaque visual em **vermelho** para itens com status "Não Avaliado" na página de preenchimento de avaliações, facilitando a identificação rápida de perigos que ainda precisam ser avaliados.

---

## Arquivo Modificado

**[frontend/src/pages/PreencherAvaliacao.jsx](frontend/src/pages/PreencherAvaliacao.jsx)**

### Mudança 1: Status do Perigo (linhas 151-160)

**ANTES:**
```javascript
} else {
  // Não avaliado
  return {
    icon: Circle,
    color: 'text-gray-400',      // Cinza
    bgColor: 'bg-white',          // Branco
    borderColor: 'border-gray-200', // Cinza claro
    label: 'Não Avaliado',
  };
}
```

**DEPOIS:**
```javascript
} else {
  // Não avaliado
  return {
    icon: Circle,
    color: 'text-red-500',        // Vermelho (ícone)
    bgColor: 'bg-red-50',         // Rosa claro (fundo do card)
    borderColor: 'border-red-300', // Vermelho claro (borda esquerda)
    label: 'Não Avaliado',
  };
}
```

### Mudança 2: Badge de Status (linhas 340-348)

**ANTES:**
```javascript
<div className="flex items-center gap-2 mt-2">
  <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color.replace('text-', 'bg-').replace('600', '100')} ${status.color}`}>
    {status.label}
  </span>
</div>
```

**DEPOIS:**
```javascript
<div className="flex items-center gap-2 mt-2">
  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
    status.label === 'Não Avaliado'
      ? 'bg-red-100 text-red-700'  // Vermelho específico para "Não Avaliado"
      : `${status.color.replace('text-', 'bg-').replace('600', '100')} ${status.color}`
  }`}>
    {status.label}
  </span>
</div>
```

---

## Resultado Visual

### Antes da Mudança
| Elemento | Cor |
|----------|-----|
| Ícone | Cinza (#9CA3AF) |
| Fundo do card | Branco |
| Borda esquerda | Cinza claro |
| Badge "Não Avaliado" | Cinza |

### Depois da Mudança
| Elemento | Cor |
|----------|-----|
| Ícone | **Vermelho** (#EF4444) |
| Fundo do card | **Rosa claro** (#FEF2F2) |
| Borda esquerda | **Vermelho claro** (#FCA5A5) |
| Badge "Não Avaliado" | **Fundo vermelho claro** (#FEE2E2) com **texto vermelho escuro** (#B91C1C) |

---

## Impacto na Experiência do Usuário

### ✅ Benefícios

1. **Identificação Rápida**: Usuário consegue identificar imediatamente quais perigos ainda não foram avaliados
2. **Chamada Visual**: A cor vermelha chama atenção para itens pendentes
3. **Consistência**: Vermelho é universalmente reconhecido como indicador de "atenção necessária"
4. **Priorização**: Facilita o trabalho do avaliador ao destacar o que precisa ser feito

### 🎨 Design Coerente

A mudança mantém coerência com outros estados:

- **Verde** (Check) → Identificado
- **Cinza** (X) → Não Identificado
- **Vermelho** (Círculo) → **Não Avaliado** (NOVO)

---

## Build do Frontend

O build foi executado com sucesso:

```bash
✓ built in 7.78s
dist/index.html                     0.48 kB │ gzip:   0.32 kB
dist/assets/index-CToFyQ2I.css     23.35 kB │ gzip:   4.87 kB
dist/assets/index-kT2BGOHU.js   1,272.79 kB │ gzip: 291.70 kB
```

---

## Deploy

### Passo 1: Verificar arquivos buildados
```bash
ls -lh frontend/dist/
```

### Passo 2: Build da imagem Docker do frontend
```bash
docker build -t ergonomia-frontend:latest ./frontend
```

### Passo 3: Deploy no Swarm
```bash
docker stack deploy -c docker-compose.swarm.yml ergonomia
```

### Passo 4: Verificar serviço atualizado
```bash
docker service ls
docker service ps ergonomia_frontend
```

### Passo 5: Testar no navegador
1. Acesse a aplicação
2. Vá para uma avaliação em andamento
3. Observe os perigos com status "Não Avaliado"
4. Devem aparecer com **destaque vermelho**

---

## Verificação Visual

Ao acessar a página de avaliação, você verá:

### Perigos "Não Avaliado"
- 🔴 **Ícone circular vermelho** à esquerda
- 📋 **Fundo rosa claro** no card inteiro
- 📍 **Borda vermelha** de 4px à esquerda do card
- 🏷️ **Badge vermelho** com texto "Não Avaliado"

### Exemplo de Card:
```
┌─────────────────────────────────────────┐
│ ║  🔴  [23] Levantamento de carga      │  ← Borda vermelha (4px)
│ ║       pesada                          │  ← Fundo rosa claro
│ ║                                       │
│ ║       [🏷️ Não Avaliado]              │  ← Badge vermelho
└─────────────────────────────────────────┘
```

### Comparação com outros estados:

**Identificado:**
```
┌─────────────────────────────────────────┐
│ ║  ✓  [23] Levantamento de carga       │  ← Verde
│ ║       [Identificado]                  │
│ ║       Severidade: 3 | Risco: Moderado│
└─────────────────────────────────────────┘
```

**Não Identificado:**
```
┌─────────────────────────────────────────┐
│ ║  ✗  [24] Exposição a ruído           │  ← Cinza
│ ║       [Não Identificado]              │
└─────────────────────────────────────────┘
```

---

## Testes Recomendados

Após o deploy, verifique:

- [ ] Cards de perigos não avaliados aparecem com fundo rosa claro
- [ ] Ícone circular está vermelho
- [ ] Borda esquerda está vermelha (4px)
- [ ] Badge "Não Avaliado" está com fundo vermelho claro e texto vermelho escuro
- [ ] Hover no card mantém o destaque visual
- [ ] Outros estados (Identificado, Não Identificado) não foram afetados
- [ ] Contador de avaliados na categoria continua funcionando
- [ ] Modal de avaliação abre corretamente ao clicar no card

---

## Arquivos Relacionados

- [PreencherAvaliacao.jsx](frontend/src/pages/PreencherAvaliacao.jsx:151-160) - Status do perigo
- [PreencherAvaliacao.jsx](frontend/src/pages/PreencherAvaliacao.jsx:340-348) - Badge de status
- [frontend/dist/](frontend/dist/) - Build gerado

---

## Próximos Passos (Opcional)

Se desejar melhorias adicionais:

1. **Animação de pulso**: Adicionar animação sutil aos cards não avaliados
2. **Contador destacado**: Mostrar total de "Não Avaliado" no header com destaque
3. **Filtro rápido**: Botão para filtrar/mostrar apenas perigos não avaliados
4. **Notificação**: Alert ao tentar finalizar avaliação com perigos não avaliados

---

## Reversão (Se Necessário)

Se precisar reverter:

1. Restaurar cores originais:
```javascript
return {
  icon: Circle,
  color: 'text-gray-400',
  bgColor: 'bg-white',
  borderColor: 'border-gray-200',
  label: 'Não Avaliado',
};
```

2. Rebuild:
```bash
cd frontend && npm run build
```

3. Redeploy:
```bash
docker stack deploy -c docker-compose.swarm.yml ergonomia
```
