# Corrigir "Gerenciar Apoios" (nada acontece ao clicar)

## O que está acontecendo

O clique funciona e leva para `/admin/biblioteca-apoios`, mas a página é protegida por uma verificação que exige exatamente o papel `admin`. A conta usada (alopsi.host@gmail.com) tem o papel `super_admin`. Como a verificação não considera que super_admin inclui admin, o site devolve o usuário para a home imediatamente — dando a sensação de que "nada acontece".

Confirmado no banco: só existem dois papéis desse tipo — `super_admin` (alopsi.host@gmail.com) e `admin` (jayme18393@gmail.com). Com a conta `admin` a página abre; com a `super_admin`, não.

## Correção

Fazer a verificação de acesso respeitar a hierarquia de papéis (super_admin > admin > moderator), igual à que o painel administrativo já usa internamente. Assim, quem é super_admin passa a acessar todas as páginas de admin.

## Detalhes técnicos

- `src/hooks/useUserRole.tsx`: em vez de chamar `has_role` com igualdade exata, buscar os papéis do usuário em `user_roles` e aplicar a hierarquia (`super_admin` satisfaz `admin` e `moderator`; `admin` satisfaz `moderator`). Manter a mesma assinatura de retorno (`{ hasRole, loading }`) para não afetar os demais consumidores.
- Nenhuma alteração de banco, RLS ou rotas. `ProtectedRoute` e `AdminLayout` permanecem como estão.
- Efeito colateral desejado: as outras rotas com `requiredRole="admin"` (ex.: `/admin/praticas`) também passam a abrir para super_admin.

## Validação

- Entrar como super_admin, clicar em "Gerenciar Apoios" no menu do nome e confirmar que a página de gestão do catálogo abre.
- Confirmar que "Acessar Admin" e as demais páginas admin continuam funcionando.
