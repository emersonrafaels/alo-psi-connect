

## Plano: Corrigir invalidacao de cache ao aprovar/rejeitar encontros

### Problema

Quando um encontro e aprovado ou rejeitado no painel admin, apenas a query `pending-sessions-approval` e invalidada. Duas outras queries ficam desatualizadas:

1. **`pending-sessions-count`** - Usada na aba "Pendentes" para mostrar o contador. Por isso o "(1)" permanece mesmo apos aprovacao.
2. **`group-sessions`** - Usada nas abas "Agendados", "Realizados" e "Rascunhos". Por isso o encontro aprovado nao aparece na lista de agendados.

### Solucao

Adicionar invalidacoes extras no `onSuccess` de ambas as mutations (`approveMutation` e `rejectMutation`).

### Mudancas

**Arquivo:** `src/components/admin/PendingSessionsApproval.tsx`

**No `onSuccess` do `approveMutation` (linha 65):**
```typescript
onSuccess: (result) => {
  queryClient.invalidateQueries({ queryKey: ['pending-sessions-approval'] });
  queryClient.invalidateQueries({ queryKey: ['pending-sessions-count'] });
  queryClient.invalidateQueries({ queryKey: ['group-sessions'] });
  // ... resto do codigo existente
},
```

**No `onSuccess` do `rejectMutation` (linha 92):**
```typescript
onSuccess: (result) => {
  queryClient.invalidateQueries({ queryKey: ['pending-sessions-approval'] });
  queryClient.invalidateQueries({ queryKey: ['pending-sessions-count'] });
  queryClient.invalidateQueries({ queryKey: ['group-sessions'] });
  // ... resto do codigo existente
},
```

Isso garante que ao aprovar ou rejeitar:
- O contador de pendentes atualiza imediatamente
- A lista de sessoes agendadas mostra o encontro recem-aprovado
- A lista de pendentes remove o encontro processado

