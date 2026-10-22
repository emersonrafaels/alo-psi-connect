# Hover nos cards do Portal Institucional

## O que muda
- Todos os cartões das páginas do portal (Visão geral, Alunos, Profissionais, Cupons, Apoios, Radar, Triagem, Comparador) ganham, ao passar o mouse: leve elevação, sombra mais forte e borda na cor primária.
- Os ícones dentro do cartão fazem um pequeno movimento (balanço/escala suave) no hover.
- Quem tem "reduzir movimento" ativado no sistema não vê animações, só a mudança de sombra.
- Modais, menus e tabelas não são afetados.

## Detalhes técnicos
- Adicionar classe `institution-portal` no contêiner raiz de cada página do portal (`InstitutionPortal`, `InstitutionStudents`, `InstitutionProfessionals`, `InstitutionSupports`, `InstitutionRadar`, `InstitutionComparator`).
- CSS escopado em `src/index.css`: `.institution-portal .rounded-lg.border` (classe base do `Card` shadcn) com `transition`, `hover:-translate-y-0.5`, `shadow` via tokens e `border-color: hsl(var(--primary)/.4)`; `.institution-portal .rounded-lg.border:hover svg` com keyframe `icon-wiggle` (rotate ±8° + scale 1.1, 450ms).
- Excluir conteúdo de dialogs (portal fora do contêiner) e `[role=dialog]`; `@media (prefers-reduced-motion)` desliga transform/animação.
- Validar com Playwright um card e ícone em hover.
