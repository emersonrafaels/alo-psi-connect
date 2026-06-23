# Modernizar página /praticas com gradientes

Refinar visualmente `src/pages/praticas/PraticasIndex.tsx` adicionando uma camada de gradientes modernos sobre a estrutura atual (hero, atalhos, destaque, grupos, áudios, CTA, selos). Sem mexer em hooks, dados ou rotas.

## Princípios

- Gradientes sutis usando tokens semânticos (`--primary`, `--accent`, `--wellness-pink` se existir) — nunca cores hardcoded.
- Manter contraste AA: gradientes vivos só em superfícies decorativas e CTAs; texto principal continua sobre `bg-card`/`bg-background`.
- Coerência com agrupamentos: cada grupo recebe um gradiente de acento sutil (mesma família, intensidade variando), sem destoar do resto do site.
- Respeitar `prefers-reduced-motion` nos elementos animados.

## Mudanças visuais

### 1. Tokens novos em `index.css`
Adicionar variáveis reutilizáveis (sem alterar tokens existentes):
- `--gradient-hero`: linear suave primary → accent → background
- `--gradient-soft`: radial primary/10 → transparent (blobs)
- `--gradient-cta`: linear primary → primary-glow (para CTA final)
- `--gradient-card`: linear card → card/60 (glass)
- `--gradient-mesh`: mesh sutil para o fundo da página
- `--shadow-glow`: sombra colorida primary/20 para hover de cards de destaque

### 2. Hero
- Fundo com `bg-[image:var(--gradient-hero)]` + blobs com `bg-[image:var(--gradient-soft)]` e `mix-blend-multiply`.
- H1 com `bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent` na parte "precisa agora".
- Badge com leve gradient border (via `before:` pseudo).
- CTA primário ganha `bg-gradient-to-r from-primary to-primary/80` + `shadow-glow` no hover.

### 3. Pill bar de atalhos
- Container com `bg-gradient-to-r from-card/80 via-card/60 to-card/80 backdrop-blur-xl`.
- Pills com gradient sutil `from-primary/5 to-accent/10` no hover.

### 4. Destaque
- Card com gradient border (wrapper `p-[1px] bg-gradient-to-br from-primary/30 via-accent/20 to-transparent rounded-[40px]`).
- Interior mantém `bg-card/80 backdrop-blur-xl`.
- Círculo do timer: SVG já usa gradient — intensificar com 2º gradient overlay e glow externo.

### 5. Grupos dinâmicos
- Cada grupo recebe um "halo" gradient sutil atrás do título (`bg-gradient-to-r from-primary/10 to-transparent` em uma faixa decorativa).
- `PraticaCard` ganha variante visual: borda com `bg-gradient-to-br from-border to-primary/20` e hover com `shadow-glow`. Editar `PraticaCard.tsx` apenas para suportar a borda gradient via classes (sem mudar API).

### 6. Práticas em áudio
- Cards com `bg-gradient-to-br from-card/80 via-card/70 to-primary/5 backdrop-blur-xl`.
- Ícone com bolha `bg-gradient-to-br from-primary/20 to-accent/20`.

### 7. CTA "Buscar apoio"
- Trocar `bg-primary` por `bg-[image:var(--gradient-cta)]` com `shadow-glow`.
- Adicionar blob radial decorativo dentro do card.

### 8. Selos de segurança
- Faixa com `bg-gradient-to-b from-muted/40 to-background` em vez de `bg-muted/40` puro.

## Detalhes técnicos

- Arquivos alterados:
  - `src/index.css` — adicionar as 6 novas CSS variables na `:root` (e equivalentes no `.dark` quando aplicável).
  - `src/pages/praticas/PraticasIndex.tsx` — aplicar classes/gradientes nas 8 seções.
  - `src/components/praticas/PraticaCard.tsx` — adicionar wrapper de borda gradient e `hover:shadow-[var(--shadow-glow)]`.
- Sem mudanças em `usePraticas`, rotas, ou lógica.
- Verificar tokens existentes (`primary-glow`, `accent`, `wellness-pink`) em `tailwind.config.ts` e `index.css` antes de referenciar; criar `--primary-glow` se não existir (lighter HSL do primary).
- Dark mode: cada novo gradiente recebe versão `.dark` com luminosidade reduzida.

## Fora de escopo

- Header/Footer
- Página de detalhe/sessão da prática
- Conteúdo textual e estrutura de seções
- Dados, hooks, queries
