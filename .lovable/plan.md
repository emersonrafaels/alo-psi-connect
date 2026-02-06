

## Plano: Corrigir Link dos Termos de Serviço na Página Sobre

### Problema Identificado

O botão "Ver Termos de Serviço" na página `/sobre` está usando um caminho incorreto:

```jsx
// Linha 158 - INCORRETO
navigate(buildTenantPath(tenantSlug, '/termos-de-servico'))
```

A rota correta definida no `App.tsx` é `/termos-servico` (sem "de").

### Mudança

| Arquivo | Linha | Antes | Depois |
|---------|-------|-------|--------|
| `src/pages/About.tsx` | 158 | `/termos-de-servico` | `/termos-servico` |

### Código

```jsx
// Linha 158 - ANTES
<Button variant="outline" onClick={() => navigate(buildTenantPath(tenantSlug, '/termos-de-servico'))}>
  Ver Termos de Serviço
</Button>

// Linha 158 - DEPOIS
<Button variant="outline" onClick={() => navigate(buildTenantPath(tenantSlug, '/termos-servico'))}>
  Ver Termos de Serviço
</Button>
```

### Rotas Existentes (App.tsx)

| Rota | Componente |
|------|------------|
| `/termos-servico` | `<TermsOfService />` |
| `/medcos/termos-servico` | `<TermsOfService />` |

### Comportamento Esperado

| Tenant | Navegação Resultante |
|--------|----------------------|
| Alopsi (Rede Bem Estar) | `/termos-servico` |
| Medcos | `/medcos/termos-servico` |

### Resultado

O botão "Ver Termos de Serviço" passará a navegar corretamente para a página de termos, respeitando o prefixo do tenant atual.

