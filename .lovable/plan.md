# Renomear item de menu para "Gerenciar Apoios"

## Mudanças

1. **Admin sidebar** (`src/components/admin/AdminSidebar.tsx`, ~linha 151): mudar o título do item de "Biblioteca de Apoios" para "Gerenciar Apoios". A rota `/admin/biblioteca-apoios` permanece a mesma.

2. **Menu do aluno** (`src/components/ui/header.tsx`, linha 61): mudar `name: "Apoios"` para `name: "Gerenciar Apoios"`. A rota `/biblioteca-apoios` permanece a mesma.

## Notas

- Apenas o texto visível do menu muda; URLs e componentes não são afetados.
- Nenhuma alteração em outras ocorrências de "Apoios" (títulos de páginas, abas, etc.).
