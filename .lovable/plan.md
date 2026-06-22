## Diagnóstico

Teste em runtime (Playwright + patch em `OscillatorNode.start`) mostrou:

- O `playGong` é chamado nos momentos corretos da cadência (528 Hz no inspirar, 440 Hz no segurar, 396 Hz no expirar) — a lógica de fases funciona.
- O console acusa repetidamente:
  - `Construction of OscillatorNode is not useful when context is closed.`
  - `Connecting nodes after the context has been closed is not useful.`
  Ou seja, em vários ciclos o `AudioContext` compartilhado já está fechado/suspenso e os osciladores não produzem som real.
- O `BreathingCircle` chama `onPhaseChange` apenas **nas transições** entre fases. O primeiro "Inspire" (estado inicial) nunca dispara sino. O usuário pode achar que o sino "não está tocando" — na verdade só começa a tocar quando a fase muda pela primeira vez (depois de `inspirar` segundos).
- O sino também é silenciado pelas regras de autoplay: o primeiro `playGong` pode ocorrer antes de qualquer gesto do usuário se ele não tocar em "Iniciar". Hoje a sessão começa com `paused = false`, então o gong pode disparar sem gesto e o navegador bloqueia.

## Objetivo

Garantir que o sino de transição realmente toque, em todos os ciclos, sem depender do ciclo de vida do drone ambiente nem do estado anterior do `AudioContext`, e fornecer um sino inicial ao começar a primeira fase.

## Alterações

### 1. `src/pages/praticas/PraticaSessao.tsx` — isolar o contexto do sino

- Criar um `gongCtxRef = useRef<AudioContext | null>(null)` separado do `audioCtxRef` (que continua sendo usado pelo drone ambiente). Assim o `close()` no unmount do componente e os ciclos pause/play do ambiente não afetam o sino.
- Reescrever `playGong(freq)`:
  - Se `gongCtxRef.current` for `null` **ou** `state === "closed"`, criar um novo `AudioContext`.
  - Sempre chamar `ctx.resume()` e usar `Promise.resolve(ctx.resume()).then(...)` para só agendar os osciladores depois do resume — evita o agendamento em contexto suspenso no iOS/Safari.
  - Subir o pico do envelope de `0.18` para `0.28` (sino fica mais audível sobre o drone).
  - Adicionar um terceiro parcial mais grave (`freq * 0.5`, ganho 0.15) para dar corpo ao sino.
  - Try/catch em volta, com `console.warn` para diagnóstico.
- No cleanup final do componente, fechar também `gongCtxRef.current` além de `audioCtxRef.current`.

### 2. Disparar sino na primeira fase

- Em `PraticaSessao.tsx`, adicionar um `useEffect` com dependência `[sino]` que, na montagem, agenda um `playGong(528)` após ~150 ms (para que o usuário associe imediatamente o sino com o início de "Inspire"). Guardar uma flag `firstGongFiredRef` para evitar duplicar quando o usuário liga/desliga o sino no meio.

Alternativa (mais simples e preferida): atualizar `BreathingCircle.tsx` para chamar `onPhaseChange?.("inspirar")` uma única vez ao montar (em um `useEffect` separado, controlado por um `useRef` de "primeira execução"). Isso dispara o gong inicial no mesmo caminho dos demais e mantém `PraticaSessao` sem lógica especial. **Vamos adotar essa.**

### 3. Resiliência a gesto do usuário

- Já interceptamos clique/teclado em `bumpIdle`. Aproveitar para chamar `gongCtxRef.current?.resume()` quando existir. Isso garante que o primeiro toque/tecla "destrava" o áudio em navegadores estritos, antes que o primeiro gong tente tocar.

### 4. Pequeno feedback visual

- Quando `sino` está ativo, o `Bell` no controle inferior pisca brevemente (`animate-ping` por 250 ms) a cada disparo de gong. Implementado via state `gongPulse` setado em `playGong` e limpo por `setTimeout`. Ajuda o usuário a confirmar que o sino está tocando mesmo com volume do dispositivo baixo.

## Validação

- Reexecutar o script Playwright já criado em `/tmp/browser/gong/test.py`, conferindo:
  - `window.__gongs` contém ao menos um evento já nos primeiros 200 ms (sino inicial).
  - Nenhum aviso "context is closed" no console.
  - Frequências seguem o padrão 528 / 440 / 396 a cada transição.
- Verificação manual no preview: iniciar a prática "Respiração lenta", confirmar áudio audível na primeira fase e a cada transição, alternar Bell/BellOff e ver que para/volta de imediato.

## Fora de escopo

- Substituir o sino sintético por um sample de gongo real (.mp3/.ogg). Pode entrar em sprint posterior se a preferência sonora não agradar.
- Sino independente por fase com timbres distintos (apenas mantemos as 3 frequências atuais).