# Adicionar item "Gerenciar Apoios" nos menus

## Mudanças

1. **Admin sidebar** (`src/components/admin/AdminSidebar.tsx`, grupo "Conteúdo"): adicionar um novo item `{ title: "Gerenciar Apoios", url: "/admin/biblioteca-apoios", icon: HeartHandshake, requiredRole: "admin" }`. O item existente "Biblioteca de Apoios" permanece. Mesma rota, dois itens.

2. **Menu do aluno** (`src/components/ui/header.tsx`, `allNavigation`): adicionar `{ name: "Gerenciar Apoios", href: buildTenantPath(tenantSlug, '/biblioteca-apoios'), module: null }`. O item existente "Apoios" permanece. Mesma rota, dois itens.

## Notas

- Apenas adições de itens de menu; URLs e componentes não são afetados.
- O ícone `HeartHandshake` já está importado no AdminSidebar.
- Nenhuma alteração em outras ocorrências de "Apoios" (títulos de páginas, abas, etc.).
