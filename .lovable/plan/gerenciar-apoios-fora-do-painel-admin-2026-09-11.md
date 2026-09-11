# Gerenciar Apoios fora do painel admin

## Objetivo
Hoje "Gerenciar Apoios" abre `/admin/biblioteca-apoios`, dentro do painel administrativo (barra lateral do admin). A gestão passa a ter uma página própria no site normal, com o cabeçalho e o rodapé do site, sem entrar no painel admin.

## O que muda

1. **Nova página** `src/pages/GerenciarApoios.tsx`
   - Reaproveita todo o conteúdo já existente de gestão (catálogo de apoios + plano por instituição), sem mudar regras nem dados.
   - Envolve o conteúdo no layout do site: `Header`, container central e `Footer`, no mesmo padrão de outras páginas internas (ex.: Triagem).
   - Continua restrita: só quem tem papel de administrador vê a página; quem não tem é levado à página inicial.

2. **Novas rotas** em `src/App.tsx`
   - `/gerenciar-apoios` e `/medcos/gerenciar-apoios`, protegidas por papel de administrador.
   - A rota antiga `/admin/biblioteca-apoios` permanece funcionando para não quebrar links salvos.

3. **Menu do perfil** (`src/components/ui/header.tsx`)
   - "Gerenciar Apoios" (desktop e mobile) passa a apontar para a nova rota com o tenant atual.

4. **Barra lateral do admin** (`src/components/admin/AdminSidebar.tsx`)
   - Os dois itens que hoje apontam para `/admin/biblioteca-apoios` são reduzidos a um único item "Gerenciar Apoios", apontando para a nova página.

## Detalhes técnicos
- O componente atual `src/pages/admin/SupportLibraryAdmin.tsx` é mantido como o corpo da gestão e é reutilizado pela nova página (import direto), evitando duplicação de código.
- Proteção via `ProtectedRoute requiredRole="admin"` (a hierarquia já aceita `super_admin`).
- Rotas geradas com `buildTenantPath` para respeitar o tenant.
- Nenhuma alteração em banco, RLS, hooks (`useAdminSupportPlan`, `useSupportLibrary`) ou na página do aluno.
