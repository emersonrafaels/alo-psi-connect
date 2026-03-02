
## Corrigir URL base nos emails de encontros

### Problema

No arquivo `supabase/functions/send-group-session-notification/index.ts`, linha 85, a URL base esta hardcoded como `https://alopsi.com.br`. Conforme as diretrizes da marca, todos os links devem usar `https://redebemestar.com.br` como dominio base para todos os tenants.

Isso faz com que os botoes no email (como "Ver Todos os Encontros", "Ver Encontro Publicado", "Ver Proximos Encontros") apontem para o dominio errado.

### Correcao

**Arquivo:** `supabase/functions/send-group-session-notification/index.ts`

Linha 85 - Trocar:
```
const siteBaseUrl = "https://alopsi.com.br";
```
Por:
```
const siteBaseUrl = "https://redebemestar.com.br";
```

### Impacto

Todos os links gerados nos emails de encontros passarao a usar o dominio correto:
- Confirmacao de inscricao: `https://redebemestar.com.br/{tenant}/encontros`
- Aprovacao/rejeicao de sessao: `https://redebemestar.com.br/{tenant}/encontros`
- Cancelamento de sessao: `https://redebemestar.com.br/{tenant}/encontros`

### Deploy

A edge function `send-group-session-notification` sera redeployada automaticamente apos a alteracao.
