
# Ajustes mobile e dark mode — página /sobre (Rede Bem-Estar)

## Diagnóstico

Após análise do `AboutRedeBemEstar.tsx` e dos tokens scoped em `src/index.css`, identifiquei dois grupos de problemas:

### 🌙 Dark mode (quebrado)
A página foi construída com cores hardcoded (`bg-white`, `text-slate-700`, `text-slate-600`, `bg-slate-50`, `border-slate-100` etc.) e variáveis CSS fixas em hex (`--rbe-bg: #FAF9FF`, `--rbe-lilac-light: #EFE6FF`). No dark mode:
- Texto cinza claro (`slate-600/700`) fica ilegível em fundo escuro
- Cards `bg-white` quebram o contraste contra o `--background` escuro
- Lilás claríssimo (`#EFE6FF`) some no dark
- Seção "O que nos diferencia" usa `bg-white/10` sobre `--rbe-primary` — ok, mas ícones/textos brancos não invertem
- Mockups do hero (Buddy, Check-in, Dashboard) ficam com fundo branco gritante

### 📱 Mobile (1144px e abaixo)
- **Hero**: composição de cards flutuantes usa `absolute` com larguras fixas (`w-56`, `w-48`, `w-64`, `w-44`) e `rotate` — em telas <420px estoura horizontalmente e gera scroll lateral
- **Padding**: `px-6` no hero + `max-w-7xl` está ok, mas seções como "Por que existimos" usam `p-10` no mobile (apertado para o ícone 28×28 + texto)
- **CTAs do hero**: `flex flex-wrap gap-4` com botões `px-8 py-4` — em 360px ficam empilhados mas sem `w-full`, ficando desalinhados
- **Tipografia hero**: `text-4xl` em 360px ainda pode quebrar mal a headline longa
- **"Como atuamos"**: linha pontilhada decorativa (`hidden md:block`) ok, mas os 3 passos viram coluna sem o número conectar visualmente
- **"Cuidado que conversa…"**: cards flutuantes com `-right-4` / `-left-4` saem do container em telas estreitas
- **Princípios (grid 6 col em lg)**: `grid-cols-2` no mobile com `p-6` e ícones grandes — fica ok mas o `text-[10px]` na descrição é difícil de ler
- **Impacto**: `grid-cols-2` no mobile com `text-4xl` no número + título — ok, mas `p-8` aperta
- **CTA final**: `p-12` no mobile com headline `text-3xl` — pode estourar em 360px

---

## Plano de implementação

### 1. Tornar tokens RBE compatíveis com dark mode
**Arquivo:** `src/index.css` (bloco `.rbe-about-page`)

- Manter as variáveis hex atuais como **light mode**
- Adicionar bloco `html.dark .rbe-about-page` (ou `.dark .rbe-about-page`) sobrescrevendo:
  - `--rbe-bg: #0F0A1A` (roxo quase preto)
  - `--rbe-surface-variant: #1A1230`
  - `--rbe-lilac-light: #2A1B45` (lilás escuro com mesma vibe)
  - `--rbe-turquoise-light: #1A3A38`
  - `--rbe-primary: #B794F4` (clarear o roxo para contraste em fundo escuro)
  - `--rbe-secondary: #6DE0D6` (mantém — funciona em ambos)
- Adicionar tokens novos `--rbe-card`, `--rbe-card-border`, `--rbe-text`, `--rbe-text-muted`, `--rbe-text-strong` (light: white/slate-100/slate-700/slate-500/slate-900; dark: slate-900/slate-800/slate-200/slate-400/white)

### 2. Substituir cores hardcoded no componente
**Arquivo:** `src/components/about/AboutRedeBemEstar.tsx`

Trocar globalmente (mantendo classes utilitárias Tailwind apontando para vars):
- `bg-white` → `bg-[var(--rbe-card)]`
- `text-slate-700` / `text-slate-600` → `text-[var(--rbe-text)]` / `text-[var(--rbe-text-muted)]`
- `text-slate-800` / `text-slate-900` → `text-[var(--rbe-text-strong)]`
- `text-slate-400` / `text-slate-500` → `text-[var(--rbe-text-muted)]`
- `border-slate-100` / `border-slate-50` → `border-[var(--rbe-card-border)]`
- `bg-slate-50` → `bg-[var(--rbe-surface-variant)]`

Casos pontuais:
- Mockup "Mini diary" (`bg-white p-4` com `bg-slate-100` nas linhas) → trocar para tokens
- Mockup "Check-in" (`bg-white` com emojis) → `bg-[var(--rbe-card)]`
- Banner CTA final em fundo `--rbe-primary` (já tem texto branco) — manter, mas no dark `--rbe-primary` clareia, então usar `--rbe-cta-bg` separado fixo (roxo escuro em ambos modos)

### 3. Ajustes responsivos no hero
**Arquivo:** `src/components/about/AboutRedeBemEstar.tsx`

- Headline: `text-3xl sm:text-4xl lg:text-6xl` (era `text-4xl sm:text-5xl lg:text-6xl`)
- Botões CTA: adicionar `w-full sm:w-auto` para alinhar bem no mobile
- Composição de cards flutuantes:
  - Adicionar wrapper com `overflow-hidden` no container do hero
  - Reduzir tamanhos no mobile: `w-44 sm:w-56 lg:w-64` para o Buddy, `w-40 sm:w-48 lg:w-56` no Check-in, `w-52 sm:w-64 lg:w-72` no Dashboard
  - Altura: `h-[380px] sm:h-[480px] lg:h-[600px]` (era 480/600)
  - Reduzir as `rotate-3` / `-rotate-6` para `rotate-2` / `-rotate-3` no mobile via classe condicional (ou `sm:rotate-3`)

### 4. Ajustes responsivos demais seções

- **"Por que existimos"**: padding `p-6 sm:p-10 lg:p-20` (era `p-10 lg:p-20`); ícone wrapper `w-20 h-20 sm:w-28 sm:h-28`
- **Mission/Vision/Propósito**: padding `p-6 sm:p-10 lg:p-12`
- **Serviços (cards 2x2)**: `p-6 sm:p-8 lg:p-10`; ícone wrapper menor no mobile
- **"Cuidado que conversa…"**: 
  - Container `p-6 sm:p-10 lg:p-20` e `rounded-[32px] sm:rounded-[48px] lg:rounded-[64px]`
  - Cards flutuantes: trocar `-right-4` por `right-2` e `-left-4` por `left-2` no mobile (`sm:-right-4 sm:-left-4`)
- **Princípios**: `text-[11px] sm:text-[10px]` (descrição) — sim, aumentar no mobile para legibilidade
- **Impacto**: `p-6 sm:p-8 lg:p-10`; número `text-3xl sm:text-4xl lg:text-5xl`
- **CTA final**: `p-8 sm:p-12 lg:p-24`; headline `text-2xl sm:text-3xl lg:text-5xl`; botão `text-sm sm:text-base lg:text-lg` e `px-6 sm:px-10 lg:px-12 py-4 sm:py-5 lg:py-6`

### 5. Garantir que não há scroll horizontal
- Adicionar `overflow-x-hidden` no container raiz `.rbe-about-page` (via classe `overflow-x-hidden` no JSX) — protege contra os elementos `absolute` com `translate-x` que extrapolam viewport

### 6. Verificação de imagem no dark mode
- A imagem "grupo de estudantes" (Unsplash) com gradient overlay continua funcionando bem nos dois modos — sem alteração

---

## Arquivos a modificar

| Arquivo | Alterações |
|---|---|
| `src/index.css` | Adicionar variantes dark dos tokens `--rbe-*` e novos tokens `--rbe-card`, `--rbe-card-border`, `--rbe-text*`, `--rbe-cta-bg` |
| `src/components/about/AboutRedeBemEstar.tsx` | Substituir cores hardcoded por vars, ajustar tamanhos/paddings responsivos, adicionar `overflow-x-hidden`, `w-full sm:w-auto` nos CTAs |

## Critérios de aceite

- ✅ Sem scroll horizontal em viewport 360px
- ✅ Hero com cards flutuantes legíveis e dentro do container em mobile
- ✅ Toggle de dark mode no header preserva a página /sobre legível (texto, cards, ícones contrastando)
- ✅ Imagem do grupo continua boa
- ✅ Tipografia escala suavemente de 360px → 1920px
- ✅ Outras páginas (Home, MEDCOS About) **não** são afetadas (tudo segue scoped em `.rbe-about-page`)
