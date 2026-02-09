
## Plano: Botao "Voltar" usar navegacao do historico

### Problema

O botao "Voltar para Encontros" na pagina de detalhes sempre navega para `/encontros`, mesmo quando o usuario veio de `/meus-encontros`. O comportamento esperado e voltar para a pagina anterior.

### Solucao

Substituir `navigate(buildTenantPath(..., '/encontros'))` por `navigate(-1)` para usar o historico do navegador. Adicionar fallback para `/encontros` caso nao haja historico.

### Mudanca

**Arquivo:** `src/pages/GroupSessionDetail.tsx` (linha 123)

- De: `onClick={() => navigate(buildTenantPath(tenantSlug, '/encontros'))}`
- Para: `onClick={() => navigate(-1)}`

Isso garante que o usuario volte para onde estava (seja `/meus-encontros`, `/encontros`, ou qualquer outra pagina de origem).
