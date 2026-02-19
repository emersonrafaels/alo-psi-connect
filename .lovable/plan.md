
## Corrigir remetente do email de recuperacao de senha

### Problema

A funcao `send-password-reset` usa o `admin_email` do tenant (que e um endereco Gmail) como remetente do email. O Resend rejeita emails enviados de dominios nao verificados, causando o erro 500.

### Solucao

**Arquivo:** `supabase/functions/send-password-reset/index.ts` (linha 135)

Alterar o campo `from` para sempre usar o dominio verificado `noreply@redebemestar.com.br`, mantendo o nome do tenant como display name:

```text
Antes:  from: `${tenantName} <${adminEmail}>`
Depois: from: `${tenantName} <noreply@redebemestar.com.br>`
```

A variavel `adminEmail` continuara sendo usada apenas para referencia interna (caso necessario no futuro), mas nao mais como remetente do Resend.

### Detalhes tecnicos

- A API key do Resend ("alopsi-lovable") tem permissao "All domains" e 221 usos, confirmando que `redebemestar.com.br` e um dominio verificado.
- Apenas este edge function (`send-password-reset`) tem o problema. As demais funcoes de email ja usam enderecos verificados ou tem logica diferente.
- Nenhuma outra alteracao e necessaria.
