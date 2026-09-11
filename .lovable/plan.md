# Select de ícones no formulário de apoios

## Objetivo
Substituir o campo de texto livre "Ícone" do formulário de criar/editar apoio (em `/gerenciar-apoios`) por um select com a lista de ícones disponíveis, mostrando o desenho do ícone ao lado do nome.

## O que será feito

1. **Select no lugar do input de texto** (`src/pages/admin/SupportLibraryAdmin.tsx`, linha ~702)
   - Usar o componente `Select` (shadcn) já utilizado nos outros campos do formulário (Origem, Categoria, Formato, Tipo de acesso).
   - As opções vêm de `SUPPORT_ICON_OPTIONS` exportado por `src/features/apoios/SupportIcon.tsx` (31 ícones: heart, puzzle, graduation, building, hands, wallet, food, bus, accessibility, briefcase, book, family, users, shield, sparkles, leaf, chat, journal, moon, path, medical, clock, gift, bookmark, headset, lotus, check, library, calendar, home, platform, grid).
   - Cada opção do select exibe o ícone renderizado (`<SupportIcon name={key} />`) ao lado do nome da chave.
   - O valor selecionado mostra ícone + nome no campo fechado.

2. **Compatibilidade com valores existentes**
   - Se um apoio já cadastrado tiver um valor de ícone fora da lista, ele entra como opção extra no select para não perder o dado (exibe o fallback Sparkles).

3. **Aplicado nos dois formulários**: "Novo apoio" e "Editar apoio" (compartilham o mesmo formulário, então uma alteração cobre ambos).

## Detalhes técnicos
- Apenas frontend, em `SupportLibraryAdmin.tsx`.
- Sem alteração de banco, hooks ou RPCs — o valor salvo continua sendo a string da chave do ícone.
- Validação: typecheck + build.
