## Adicionar "Triagem" no menu do usuário

### Mudança
Mover o acesso à listagem completa de pacientes do menu admin para o menu do usuário (dropdown do avatar, ao lado de "Meus Agendamentos", "Encontros", "Meu Perfil"), com o rótulo **"Triagem"**, gated pelo mesmo `usePatientFullViewAccess`.

### Nova rota
- `/triagem` (fora do `AdminLayout`) — renderiza dentro do shell público com `Header`/`Footer`, protegida por `ProtectedRoute` + checagem de `usePatientFullViewAccess`. Sem acesso → redireciona para `/`.

### Página
- Novo `src/pages/Triagem.tsx`: wrapper que reaproveita a UI atual de `PatientsFullView` (tabela + drawer + CSV). Extrair o conteúdo em um componente compartilhado `src/components/triagem/PatientsTriageView.tsx` para que tanto `/triagem` (usuário) quanto `/admin/pacientes-completo` (admin) reutilizem o mesmo componente sem duplicação.
  - `PatientsFullView.tsx` (admin) passa a ser um wrapper fino também.
  - O componente compartilhado mantém: busca, paginação, CSV, drawer com tabs (Perfil, Conta, Instituições, Diário, Encontros) — sem mudanças funcionais.

### Header (menu do usuário)
`src/components/ui/header.tsx`:
- Importar `usePatientFullViewAccess` e ícone `ClipboardList` (ou `Stethoscope`).
- No dropdown desktop (após "Meu Perfil", antes do bloco admin): se `hasAccess`, mostrar `DropdownMenuItem` "Triagem" navegando para `/triagem` (via `buildTenantPath(tenantSlug, '/triagem')`).
- Espelhar no menu mobile (mesmo bloco ~linhas 347–374).

### AdminSidebar
- Manter o item "Pacientes (completo)" como está — ainda funciona via `/admin/pacientes-completo` (mesma view compartilhada). Sem mudança aqui. (Posso remover se preferir; me diga.)

### App.tsx
- Adicionar rota `/triagem` renderizando `<Triagem />` dentro do shell público (mesmo padrão de `/perfil`, `/agendamentos`, `/meus-encontros`).

### Sem mudanças
- Edge function `admin-patients-overview`, hooks (`usePatientFullViewAccess`, `useAdminPatientsOverview`), config de allow-list em `Configurations.tsx`, schema do banco.

### Passos de teste
1. Logar como usuário na allow-list → "Triagem" aparece no menu do avatar.
2. Clicar → abre `/triagem` com header/footer do site (não o layout admin) e mostra a listagem.
3. Logar como usuário sem permissão → item não aparece; acessar URL direta redireciona para `/`.
4. Drawer, CSV, busca e paginação funcionam igual ao admin.
