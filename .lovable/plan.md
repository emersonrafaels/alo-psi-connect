# Práticas mais imersivas — Tela de Sessão

Foco: `src/pages/praticas/PraticaSessao.tsx` e `src/components/praticas/BreathingCircle.tsx`. Sem mudar o índice, detalhe ou conclusão neste passo.

## Conceito visual

Cena em camadas, cinematográfica mas calma (intensidade 3/5), usando a paleta atual (primary roxo + accent rosa + teal já existentes no tenant — sem hardcode de cor):

```text
┌──────────────────────────────────────────┐
│  ░░░ gradiente radial primary→accent ░░░ │  ← fundo, drift lento
│   · · ·   pontos luminosos flutuando · · │  ← partículas (~25)
│        ╭───────────╮                     │
│       (  halo glow  )                    │  ← aura pulsando c/ respiração
│        ╰───────────╯                     │
│            circle                        │  ← BreathingCircle (escala c/ fase)
│         "Inspire 4s"                     │
│        ▁▂▃▄▅▆ progresso                  │
└──────────────────────────────────────────┘
```

## Mudanças por componente

### 1. `PraticaSessao.tsx` — cena imersiva
- Substituir o `bg-gradient-to-br from-primary…` por uma **cena em camadas absolutas**:
  - Camada A: `radial-gradient` duplo (primary no centro-superior, accent no canto inferior), animado via `@keyframes auroraDrift` (background-position oscilando ~30s, ease-in-out).
  - Camada B: SVG inline com ~25 círculos pequenos (`fill="hsl(var(--primary-foreground) / 0.4)"`), cada um com `animate-[float_*s_ease-in-out_infinite]` em durações 8-16s aleatórias, criando partículas flutuantes.
  - Camada C: vinheta `radial-gradient(transparent → bg/40)` para foco central.
  - Sincronia com pausa: aplicar `[animation-play-state:paused]` nas camadas quando `paused === true`.
- **Header/footer**: deslizar para fora ao ficar idle por 4s sem interação (mouse/touch), com `opacity-0 -translate-y-2` / `translate-y-2`, voltar em `pointermove`. Em mobile o `tap` reexibe.
- **Mobile**: viewport-lock — `100dvh` (não `100vh`), `overscroll-none`, `touch-none` no fundo. Headers compactam para `py-3` em `< sm`.
- **Desktop**: layout permanece centrado; partículas e gradiente ocupam 100% da viewport.
- Barra de progresso ganha um glow sutil (`shadow-[0_0_12px_hsl(var(--primary-foreground)/0.6)]`).

### 2. `BreathingCircle.tsx` — halo respirante
- Adicionar 2 anéis SVG concêntricos com `stroke-dasharray` rotacionando lentamente (10s linear) por trás dos 3 círculos atuais.
- Aumentar contraste das camadas internas e adicionar `mix-blend-screen` no halo externo para fundir com o gradiente da cena.
- Em mobile, manter `w-72 h-72`; em `sm+`, `w-[26rem] h-[26rem]` para mais presença em desktop.

### 3. Trilha sonora ambiente (toggle)
- Estado novo `[ambient, setAmbient]` (default `true`).
- Novo `<audio>` oculto com `loop`, volume `0.25`, src vindo de `public/audio/ambient-praticas.mp3` (placeholder vazio — usuário sobe depois) **ou** procedural via Web Audio (oscilador sine 110Hz + 220Hz com lowpass + LFO) — preferir Web Audio para evitar dependência de asset; auto-suspende quando paused.
- Botão extra no footer: `<Music2/>` / `<Music2 c/strike>` ao lado do botão de mute do guia. `aria-label`s claros.
- Persistência: salvar preferência em `localStorage` (`praticas:ambient`).

### 4. Tokens novos em `index.css`
- `@keyframes auroraDrift`, `@keyframes float`, `@keyframes haloPulse` no bloco global (não em `@layer`).
- `--shadow-immersive: 0 0 60px hsl(var(--primary) / 0.4)` para o halo.

## Acessibilidade
- Respeitar `prefers-reduced-motion`: desligar `auroraDrift`, `float` e `haloPulse` (manter só o círculo respirando).
- Todos os controles mantêm foco visível e `aria-label`.
- Áudio ambiente nunca toca sem ação do usuário (já há clique para entrar na sessão).

## Fora de escopo (deste passo)
- Índice, Detalhe e Conclusão (mencionados no menu original mas não selecionados pelo usuário).
- Asset de áudio real — fica como Web Audio procedural agora; você pode trocar por mp3 depois.

Posso seguir?
