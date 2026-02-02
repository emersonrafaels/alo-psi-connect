

## Plano: Melhorar Tratamento de Token Já Utilizado

### Diagnóstico

O email do usuário `ceked29859@1200b.com` **foi confirmado com sucesso** às 02:58:49. Porém, ao clicar novamente no link (às 02:58:50), recebeu erro porque o sistema trata token já usado como erro.

| Horário | Ação | Resultado |
|---------|------|-----------|
| 02:58:49 | 1ª tentativa | ✅ Sucesso (token marcado como usado) |
| 02:58:50 | 2ª tentativa | ❌ Erro "Token inválido" |

### Problema

A edge function `confirm-email` retorna **erro 400** quando encontra um token já usado, mas não verifica se o **email já está confirmado** - o que resultaria em uma experiência positiva para o usuário.

### Solução

Modificar a edge function para:
1. Se token não encontrado (ou já usado) → verificar se o email associado já está confirmado
2. Se já confirmado → retornar **sucesso** com mensagem amigável
3. Se não confirmado → manter erro atual

```text
Token não encontrado ou usado?
├── Buscar token pelo valor (sem filtro de used)
│   ├── Token encontrado → Verificar se user já tem email confirmado
│   │   ├── Sim → Retornar sucesso "Email já confirmado"
│   │   └── Não → Retornar erro "Token inválido ou expirado"
│   └── Token não existe → Retornar erro "Token inválido"
```

### Mudanças Técnicas

**Arquivo:** `supabase/functions/confirm-email/index.ts`

**Lógica atualizada (linhas 49-69):**

```typescript
// Find the token in database (including already used tokens)
console.log("Searching for token in database...");
const { data: tokenData, error: tokenError } = await supabase
  .from('email_confirmation_tokens')
  .select('*')
  .eq('token', token)
  .single();

console.log("Token search result:", { tokenData, tokenError });

if (tokenError || !tokenData) {
  console.error('Token not found:', tokenError);
  return new Response(
    JSON.stringify({ error: "Token inválido ou expirado" }),
    { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...corsHeaders } 
    }
  );
}

// If token was already used, check if email is already confirmed
if (tokenData.used) {
  console.log('Token already used, checking if email is confirmed...');
  
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(tokenData.user_id);
  
  if (!userError && userData?.user?.email_confirmed_at) {
    console.log('Email already confirmed for user:', tokenData.user_id);
    return new Response(
      JSON.stringify({ 
        message: "Email já foi confirmado anteriormente!",
        success: true,
        alreadyConfirmed: true
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
  
  // Token used but email not confirmed - this shouldn't happen, but handle it
  return new Response(
    JSON.stringify({ error: "Token já foi utilizado" }),
    { 
      status: 400, 
      headers: { "Content-Type": "application/json", ...corsHeaders } 
    }
  );
}

// Continue with normal flow for unused tokens...
```

### Resumo das Alterações

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/confirm-email/index.ts` | Verificar se email já está confirmado antes de retornar erro |

### Resultado Esperado

**Antes:**
- Usuário clica 2x no link → Vê erro na segunda vez
- Experiência confusa

**Depois:**
- Usuário clica 2x no link → Vê "Email já confirmado!" na segunda vez
- Experiência positiva

### Nota

O email do usuário `ceked29859@1200b.com` **já está confirmado** no sistema. Ele pode fazer login normalmente agora.

