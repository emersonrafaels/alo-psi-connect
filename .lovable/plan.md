

## Corrigir email de recuperacao de senha

### Alteracoes

**Arquivo:** `supabase/functions/send-password-reset/index.ts`

**1. Subtitulo do header (linha 81)**

Trocar o fallback de "Conectando voce ao cuidado mental" para "Conectando voce ao cuidado":

```text
Antes:  'Conectando você ao cuidado mental'
Depois: 'Conectando você ao cuidado'
```

**2. Dominio do link de recuperacao (linhas 124-128)**

Atualmente o link usa `alopsi.com.br` como base. O correto e usar `redebemestar.com.br` para ambos os tenants, ja que esse e o dominio principal da plataforma:

```text
Antes:
  baseUrl = "https://alopsi.com.br"
  alopsi  -> /auth?reset=true&token=...
  medcos  -> /medcos/auth?reset=true&token=...

Depois:
  baseUrl = "https://redebemestar.com.br"
  alopsi  -> /auth?reset=true&token=...
  medcos  -> /medcos/auth?reset=true&token=...
```

Alterar o fallback de `APP_BASE_URL` de `https://alopsi.com.br` para `https://redebemestar.com.br`.

### Resultado

- Header do email: "Conectando voce ao cuidado"
- Link para alopsi: `https://redebemestar.com.br/auth?reset=true&token=xxx`
- Link para medcos: `https://redebemestar.com.br/medcos/auth?reset=true&token=xxx`
