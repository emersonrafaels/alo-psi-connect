# Roda das Emoções — melhoria e otimização

## Onde estamos

A roda hoje (`EmotionWheel.tsx`, 355 linhas) já tem três anéis, tons por nível e tinta calculada por luminância. Pontos que ainda pesam na experiência, verificados no código atual:

- O anel externo (nível 3) é desenhado para **todas** as fatias da família, mesmo as não escolhidas — em Alegria/Raiva são 16 fatias minúsculas dessaturadas com rótulos rotacionados de 11px. Ruído visual e leitura difícil.
- Tamanho fixo (`viewBox` 640) com rótulos em px absolutos: em telas estreitas as palavras de nível 3 ficam ilegíveis e as fatias abaixo da área de toque confortável.
- Ao abrir uma família, o código dá `focus()` na primeira fatia — isso pode puxar o scroll da página numa experiência de tela única.
- Não há `prefers-reduced-motion` respeitado na roda, nem transição de revelação dos anéis.
- Sem estado de hover informativo: para saber o que uma fatia é, só dá para ler o rótulo cortado.

## O que muda

### 1. Anel externo focado

- Nível 3 passa a ser desenhado apenas para a fatia de nível 2 selecionada (e ocupando um arco maior, com rótulo confortável). Sem seleção, o anel externo aparece como uma faixa neutra "escolha uma palavra" em vez de dezenas de fatias.
- Ao selecionar outra fatia de nível 2, o anel externo transiciona suavemente para o novo par de palavras.

### 2. Legibilidade e toque

- Rótulos com tamanho derivado do ângulo/raio disponível, não de contagem de caracteres; nível 3 sem rotação quando o arco é largo (o novo comportamento focado permite texto horizontal).
- Área mínima de toque garantida: em telas < 640px a roda cresce até a largura total e o anel externo ganha espessura.
- Contornos entre fatias mais finos e hover com leve elevação/brilho, mantendo a tinta legível já calculada por `inkOn`.

### 3. Navegação e acessibilidade

- Foco só é movido quando a seleção veio do teclado (evita scroll-jump ao clicar).
- Setas percorrem o anel atual, `ArrowUp`/`ArrowDown` movem entre níveis, `Esc` sobe um nível, `Home`/`End` vão à primeira/última fatia.
- `aria-live` discreto anunciando "Família X · palavra Y" quando o estado muda.
- Animações condicionadas a `usePrefersReducedMotion` (hook já existe no projeto).

### 4. Núcleo mais útil

- Núcleo mostra Família → palavra nível 2 → palavra nível 3 em hierarquia clara, com ação primária "seguir" quando o nível 3 estiver escolhido e "voltar" secundário.

### 5. Otimização

- Geometria (setores, pontos de rótulo, tons por anel) memoizada por família em vez de recalculada a cada render.
- `sliceRefs` com callback estável; remoção de recálculos de `shade`/`muteColor` dentro do loop de render.

## Detalhes técnicos

- `src/features/jornada/components/EmotionWheel.tsx`: render do anel 3 condicionado à seleção; helpers de geometria memoizados; tamanho de fonte por arco; teclado estendido; `aria-live`.
- `src/features/jornada/utils/wheelColors.ts`: reutilizado como está; possível adição de tom neutro para o anel externo vazio.
- `src/hooks/usePrefersReducedMotion.tsx`: usado para desligar transições.
- `src/features/jornada/pages/JornadaSessao.tsx`: ajustes apenas de container/responsividade da seção da roda.
- Sem mudanças no reducer, taxonomia, motor de recomendação, analytics ou banco.
