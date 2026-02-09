

## Plano: Corrigir botao "Voltar" com fallback robusto

### Problema

O `navigate(-1)` pode falhar em cenarios onde:
- O usuario abre o link direto do encontro (sem historico anterior no app)
- O iframe do preview reinicia o historico de navegacao
- O historico aponta para fora do app

### Solucao

Usar uma abordagem hibrida: tentar voltar no historico, mas com fallback para `/encontros` caso nao haja historico suficiente.

### Mudanca

**Arquivo:** `src/pages/GroupSessionDetail.tsx`

Substituir o `onClick` do botao por uma funcao que verifica o historico:

```typescript
const handleGoBack = () => {
  if (window.history.length > 1) {
    navigate(-1);
  } else {
    navigate(buildTenantPath(tenantSlug, '/encontros'));
  }
};
```

E no botao:
```typescript
onClick={handleGoBack}
```

Isso garante que:
1. Se o usuario veio de `/meus-encontros`, volta para la
2. Se o usuario veio de `/encontros`, volta para la
3. Se o usuario abriu o link direto (sem historico), vai para `/encontros` como fallback

