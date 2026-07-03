## Objetivo

Fazer a área do Buddy (`/buddy` e sub-rotas) funcionar bem em celulares e tablets, corrigindo overflow, navegação e densidade dos cards.

## Problemas observados

Na captura em 390px:
- Título "Olá, {nome}" quebra fora da tela (não tem `break-words`).
- Nav lateral vira barra horizontal com scroll — labels ficam cortadas ("Como te conh…").
- Balão de fala do mascote transborda (max-w fixo).
- Cards de recomendação e retrato ficam com padding grande demais em mobile.
- `BuddyPortrait` usa grid `lg:grid-cols-[1fr_280px]` ok, mas o stepper de seções e sliders precisam de checagem em mobile.
- Botões (Atualizar / Ver o que percebeu) empilham mal (ok com flex-wrap, mas ícones podem estourar).

## Mudanças

### 1. `src/components/buddy/BuddyLayout.tsx`
- Trocar nav lateral por um padrão responsivo:
  - **Mobile (<lg)**: barra horizontal com scroll suave, `snap-x`, ícones + label curta, com fade nas bordas.
  - **Desktop (lg+)**: sidebar sticky como hoje.
- Adicionar `min-w-0` no `<main>` e `break-words` no `<h1>`.
- Reduzir tamanho do título em mobile (`text-2xl` → `md:text-3xl` → `lg:text-4xl`).
- Reduzir padding do container em mobile (`px-4 py-6 sm:py-8`).

### 2. `src/components/buddy/BuddyMascot.tsx`
- Trocar `max-w-xs` do balão por `max-w-none flex-1 min-w-0` para adaptar à coluna.
- Permitir empilhar mascote+balão em mobile (`flex-col sm:flex-row`) opcionalmente, mas manter horizontal com balão fluido.

### 3. `src/pages/buddy/BuddyHome.tsx`
- No `CardHeader` do mascote: usar `flex-col sm:flex-row` e `min-w-0` para o balão respirar.
- Botões: manter `flex-wrap gap-2` e adicionar `w-full sm:w-auto` para CTAs principais em mobile.
- Grid de recomendações: já é `md:grid-cols-2 lg:grid-cols-3` — reduzir padding interno em mobile (`p-4 sm:p-5`).
- Truncar/`break-words` em títulos longos das recomendações.

### 4. `src/pages/buddy/BuddyPortrait.tsx`
- Garantir `min-w-0` na coluna principal e revisar `ProgressHeader`/`SectionStepper` para scroll horizontal com snap em mobile.
- Textareas com `min-h` menor em mobile.
- Grid `lg:grid-cols-[1fr_280px]` já é responsivo; aside vira topo em mobile (revisar ordem: manter dicas abaixo em mobile via `order-last lg:order-none`).

### 5. Demais páginas Buddy (`BuddyKnows`, `BuddyPatterns`, `BuddyJourney`, `BuddyStrengths`, `BuddyPrivacy`)
- Revisão rápida: adicionar `min-w-0`, `break-words` em títulos, `flex-wrap` em barras de ação, e cards com `p-4 sm:p-6`.
- Gráficos (Padrões/Jornada): garantir `w-full` no container e altura fixa responsiva.

### 6. `BuddyDailyBrief.tsx` (home geral)
- Já responsivo, mas o grid `md:grid-cols-[auto_1fr_auto]` empilha ok. Ajustar apenas ordem do CTA para ficar abaixo do texto em mobile e ocupar largura total.

## Escopo fora
- Sem mudanças de dados, hooks ou backend.
- Sem mudança de cores/tema (já roxo).
- Sem novas features — apenas responsividade e layout.

## Validação
- Rodar Playwright em 375×812 (mobile), 768×1024 (tablet), 1280×900 (desktop) capturando `/buddy`, `/buddy/me-conhecer`, `/buddy/padroes`, `/buddy/jornada` e conferir ausência de overflow horizontal e labels cortadas.