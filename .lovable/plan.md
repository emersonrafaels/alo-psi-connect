## Plano: Botão "Habilitar/Desabilitar ver Triagem" no menu Ações

No `src/pages/admin/Users.tsx`, adicionar um item no `DropdownMenu` de Ações (após "Gerenciar Instituições") que alterna o usuário na lista `system_configurations` → `admin_access / patient_full_view_allowed_users` (mesma lista usada pelo card em Configurações).

### Implementação

1. **Novo hook** `src/hooks/useTriageAccessToggle.tsx`:
   - `useTriageAllowedList()` → React Query que lê a configuração e retorna `{ id, list }`.
   - `useToggleTriageAccess()` → mutation que adiciona/remove o `user_id` na lista, faz `update` se `id` existir, `insert` caso contrário, e invalida `['triage-allowed-list']` + `['patient-full-view-access']`.

2. **`src/pages/admin/Users.tsx`**:
   - Importar o hook e o ícone `Eye` / `EyeOff` do lucide-react.
   - Consumir `useTriageAllowedList()` uma vez no componente.
   - Para cada usuário, calcular `hasTriageAccess = list.includes(user.user_id)`.
   - Adicionar `<DropdownMenuItem>` logo após "Gerenciar Instituições":
     - Label dinâmico: "Habilitar ver Triagem" ou "Desabilitar ver Triagem".
     - Desabilitado quando `!user.user_id` ou o usuário tem role `admin`/`super_admin` (acesso já automático), com tooltip/legenda discreta.
     - `onClick` chama a mutation com toast de sucesso/erro.

### Fora de escopo
- Nenhuma mudança no schema, no card de Configurações, no `usePatientFullViewAccess`, ou em rotas/permissões da página `/triagem`. Apenas adiciona um atalho de gestão no menu de Ações.
