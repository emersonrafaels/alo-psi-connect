## Objetivo

Refazer `src/pages/praticas/PraticasIndex.tsx` com a estrutura visual dos 3 mockups Stitch, **substituindo o fundo dark/shader e o "white-on-glass"** por uma versão clara, alinhada à identidade Rede Bem-Estar (`primary` teal + acento `wellness-pink`, tipografia serif para títulos, alto contraste WCAG AA). Os dados continuam vindo de `usePraticas` e `usePraticasAtalhos` — nenhuma seção hardcoded substitui grupos reais.

## Princípios de adaptação visual

- **Fundo:** trocar shader fullscreen por um gradiente sutil `from-primary/5 via-background to-background` + blobs decorativos suaves (`bg-primary/10 blur-3xl`), aplicados em camadas com `pointer-events-none`.
- **Glass cards:** usar `bg-card/70 backdrop-blur-md border border-border/60 shadow-sm` (claro), nunca `bg-white/10` sobre dark.
- **Tipografia:** títulos em `font-serif` (atual), corpo em `text-foreground`/`text-muted-foreground`. Nada em `text-white`.
- **Cores de acento:** `primary` substitui `energy-teal`; `secondary` ou `wellness-pink` (já existir? se não, usar `accent`/`primary/70`) para o segundo acento. Verificar `tailwind.config.ts` antes — se faltar token, reutilizar tokens existentes.
- **Ícones:** continuar com `IconePratica` (lucide), não Material Symbols.

## Estrutura nova da página (ordem)

1. **Hero**
   - Badge "Práticas guiadas" + título serif grande + subtítulo + microcopy "De 2 a 10 minutos · áudio, texto e orientação visual".
   - Dois CTAs: "Encontrar uma prática" (rola pra `#grupos`) e "Explorar todas" (rola pro grid final).
   - Decoração: anel pulsante sutil atrás do título usando `primary/20`.

2. **Seletor "O que você precisa agora?"** (pill bar) — **reaproveita `atalhos`** do hook. Cada atalho vira pill clicável que rola/filtra. Sem mock.

3. **Prática em destaque** (painel glass + visual circular) — usa a **primeira prática do primeiro grupo** (ou um destaque marcado se houver `categoria_badge === "destaque"`; senão fallback para 1ª).
   - Texto à esquerda + círculo de duração com gradiente `primary → primary/60` à direita.
   - CTA "Começar prática" → link `${basePath}/praticas/${slug}`.

4. **Grupos dinâmicos** (`grupos.map`) — para cada grupo, render:
   - Título serif + descrição.
   - Grid de `PraticaCard` (componente atual permanece, só revisitamos hover/borda para ficar coerente).
   - **Mantém 1 seção por grupo ativo**, na ordem definida no banco. Nenhuma seção fixa "Para recuperar o foco" sobrepõe um grupo real.

5. **"Prefere apenas ouvir?"** — filtra `praticas` cujo `formato` inclua áudio (se o campo existir; caso contrário, omitir a seção). Grid de 3 cards glass claros.

6. **CTA final** (mantém o atual): card primary "Você não precisa lidar com tudo sozinha" com links para profissionais/sobre.

7. **Curadoria/segurança** (linha inferior, condensada): 4 selos check_circle ("Orientações simples", "Ritmo adaptável", "Áudio opcional", "Sem cobrança") + nota "não substitui acompanhamento profissional".

## Implementação técnica

- Editar **somente** `src/pages/praticas/PraticasIndex.tsx`. Sem mudanças em hooks, rotas ou banco.
- Reutilizar `PraticaCard`, `Card`, `Button`, `Badge`, `Skeleton` do design system.
- Animação do círculo: `animate-pulse-ring` — adicionar keyframe em `tailwind.config.ts`/`index.css` se ainda não existir (`@keyframes pulse-ring { 0%{transform:scale(.95);opacity:.6} 100%{transform:scale(1.15);opacity:0} }`).
- Scroll suave entre seções com `scrollIntoView({behavior:"smooth"})`.
- Manter `window.scrollTo(0,0)` no mount e `document.title`.

## Fora de escopo

- Sem alterar Header/Footer.
- Sem criar tabela "destaque" — usa a primeira prática como fallback.
- Sem integrar Buddy/AI ou estatísticas de continuidade (mockups exibem "12 práticas concluídas"; ignoramos porque exige nova tabela).
- Sem agenda de "Práticas em grupo" (vive em outro módulo de Sessões em Grupo).

```
HERO
 └─ badge + h1 serif + sub + 2 CTAs

PILL BAR (atalhos do banco)

DESTAQUE (primeira prática)
 ├─ texto + CTA
 └─ círculo com duração

GRUPOS DINÂMICOS (map)
 └─ por grupo: título + cards

PRÁTICAS EM ÁUDIO (se houver)

CTA "Buscar apoio"

SELOS DE SEGURANÇA
```
