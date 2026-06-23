## Problemas atuais do sino

1. **Práticas de respiração** (`BreathingCircle`): o sino toca em **toda mudança de fase** (inspirar, segurar, expirar, pausa, suspiro curto). Numa 4-7-8 ou box, isso são 3-4 sinos por ciclo — vira distração em vez de marcação.
2. **Pausa de 3 minutos**: bug — `onEtapaChange` é uma arrow inline em `PraticaSessao`, recriada a cada render. O `useEffect([etapaIdx, onEtapaChange])` em `PausaTresMinutosSessao` dispara o sino a cada segundo enquanto `etapaIdx > 0`.
3. **Grounding 5-4-3-2-1**: não toca sino nenhum.
4. **Início e fim da sessão**: nenhum sino marca abertura ou encerramento.

## Comportamento desejado (por prática)

| Prática | Quando o sino toca |
|---|---|
| Início de qualquer sessão | 1 sino grave (396 Hz) ao iniciar |
| Fim de qualquer sessão | 1 sino grave (396 Hz) antes de ir ao checkout |
| Suspiro de alívio | 1 sino agudo (528 Hz) no início de cada novo ciclo (segunda inspiração curta marca o pico, expiração longa marca o fim) — apenas **1 sino por ciclo** |
| Respiração lenta e ritmada | 1 sino agudo no início de cada inspiração (1 por ciclo) |
| Respiração em 4 etapas (box) | 1 sino no início de cada inspiração (1 por ciclo) |
| Respiração 4-7-8 | 1 sino no início de cada inspiração (1 por ciclo) |
| Pausa de 3 minutos | 1 sino na transição entre etapas (em 1:00 e 2:00). Sem repetição. |
| Grounding 5-4-3-2-1 | 1 sino suave ao avançar para o próximo passo |

## Mudanças técnicas

**`src/pages/praticas/PraticaSessao.tsx`**
- Tocar sino de **abertura** uma única vez quando a sessão monta e o áudio está destravado (no primeiro tick após `wakeChrome`/play).
- Tocar sino de **encerramento** antes do `navigate(...)` para o checkout (timer chegou ao fim ou usuário clicou `encerrar`).
- Em `onPhaseChange`, tocar o sino **apenas** quando `next === "inspirar"` (início do ciclo). Demais fases continuam disparando vibração leve (se preferir), mas sem áudio.
- Memoizar o callback passado a `PausaTresMinutosSessao` com `useCallback([sino, playGong])` para corrigir o bug de re-disparo.
- Adicionar callback `onAvancarPasso` em `GroundingSessao` e tocar sino quando o usuário avança.

**`src/components/praticas/PausaTresMinutosSessao.tsx`**
- Usar `useRef` para rastrear o `etapaIdx` anterior e só chamar `onEtapaChange` quando ele realmente mudar (efeito robusto independente da identidade do callback).

**`src/components/praticas/GroundingSessao.tsx`**
- Aceitar prop `onAvancar?: () => void` e chamá-la em `proximo()` antes de avançar/concluir.

Sem mudanças em banco, áudio ambient, trilha ou UI do botão do sino.