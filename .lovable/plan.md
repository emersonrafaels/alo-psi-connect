## Problema

Ao clicar em "Acessar Admin", a página `/admin` carrega por um instante e redireciona de volta para `/`.

Causa: race condition de autenticação em `src/hooks/useAdminAuth.tsx`. O hook usa `user` vindo de `useAuth`, mas não observa o `loading` do `useAuth`. Em uma navegação dura para `/admin`, o `useAuth` ainda está restaurando a sessão (`user = null`, `loading = true`), o `useAdminAuth` roda o efeito com `!user`, marca `isAdmin = false` e `loading = false`, e o `AdminLayout` faz `<Navigate to="/" />` antes da sessão ser restaurada.

## Correção

Editar **`src/hooks/useAdminAuth.tsx`**:

1. Importar `loading: authLoading` de `useAuth()`.
2. No `useEffect`, enquanto `authLoading` for `true`, manter `loading = true` e não decidir nada — apenas retornar cedo (sem zerar roles).
3. Adicionar `authLoading` no array de dependências do `useEffect`.
4. Só quando `authLoading === false`:
   - se `!user` → `isAdmin=false`, `roles=[]`, `loading=false`.
   - se `user` → buscar roles como hoje.

Isso garante que `AdminLayout` continue mostrando o skeleton até a sessão estar pronta, em vez de redirecionar prematuramente.

## Fora de escopo

- Nenhuma mudança em `AdminLayout`, rotas, `ProtectedRoute`, ou outros hooks.
- Sem mudanças visuais.
