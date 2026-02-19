

## Corrigir link de recuperacao de senha (APP_BASE_URL)

### Problema

O codigo le `Deno.env.get("APP_BASE_URL")` que esta configurado como secret com valor `https://alopsi.com.br`. Esse valor tem prioridade sobre o fallback `https://redebemestar.com.br` que foi adicionado.

### Solucao

**Arquivo:** `supabase/functions/send-password-reset/index.ts` (linha 124)

Remover a dependencia da variavel de ambiente e usar diretamente o dominio correto:

```text
Antes:  const baseUrl = Deno.env.get("APP_BASE_URL") || "https://redebemestar.com.br";
Depois: const baseUrl = "https://redebemestar.com.br";
```

Isso garante que o link sempre use `redebemestar.com.br` independentemente de qualquer secret configurado.

### Resultado

- Link alopsi: `https://redebemestar.com.br/auth?reset=true&token=xxx`
- Link medcos: `https://redebemestar.com.br/medcos/auth?reset=true&token=xxx`

