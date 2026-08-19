# Jornada de Autorregulação (protótipo) — Fases 1 e 2

Nova experiência dentro de Práticas, isolada em rota própria de protótipo, sem alterar as páginas de Práticas existentes (`/praticas`, `/praticas/:slug`, sessão, checkout, concluída).

## Rotas

- `/praticas/jornada` — entrada da jornada (3 caminhos)
- `/praticas/jornada/sessao` — fluxo da jornada (roda → intensidade → contexto → recomendação → prática)
- Espelho em `/medcos/praticas/jornada*` seguindo o padrão atual de rotas por tenant
- Link de acesso: card destacado "Jornada de Autorregulação — protótipo" no topo de `PraticasIndex`, com badge discreto de versão protótipo

## Entrada de Práticas (Fase 1)

Três caminhos, mapeados para `JourneyMode`:

- Cuidar de como estou agora → `regulate`
- Entender melhor o que estou sentindo → `understand`
- Escolher uma prática → `library` (reaproveita a biblioteca atual)

## Roda das Emoções

- 3 níveis (família → intermediária → refinamento opcional), com breadcrumb persistente
- Nível 2 já confirmável; nível 3 opcional
- Taxonomia vinda de configuração (`emotion-taxonomy`), IDs únicos hierárquicos (ex.: `tristeza_culpa_envergonhado`); labels repetidos convivem com IDs distintos; label nunca é identificador
- `taxonomyVersion` no config e propagado para sessão e analytics
- Desktop: roda circular (6 famílias, cores da referência). Mobile: drill-down por níveis, cards empilhados, botões grandes
- Alternativa acessível: "Não encontro exatamente o que estou sentindo" abre a mesma taxonomia em lista com busca; navegação por teclado e foco visível

## Intensidade e branching

Escala 1–5 (Pouco, Leve, Moderado, Forte, Muito forte), descrita apenas como presença da emoção no momento.

- 1–3: pergunta contextual curta antes da recomendação
- 4–5: vai direto à recomendação, com o mínimo de texto e decisões; "entender melhor" só é oferecido após o checkout

Nenhum alerta institucional ou classificação de risco derivado de intensidade.

## Recommendation Engine (Fase 2)

Motor determinístico, puro, sem IA:

- Precedência: override de nó específico → emoção nível 2 → família → intensidade → resposta contextual
- Filtra práticas por `status` (apenas `active`, salvo autorização explícita na configuração) e `curatorApproved`
- Retorna 1 principal + até 2 alternativas; nunca lista o catálogo
- "Prefiro outra opção" revela as alternativas
- Bloco "Por que esta prática?" explicando emoção + intensidade + contexto, sem promessa terapêutica; card da curadoria conforme os ativos de referência
- Cada resultado gera um `RecommendationDecision` (regra, versão, práticas, `matchedOn`) guardado na sessão

## Practice Registry e players

- Registry em configuração com os campos do contrato (`id`, `version`, `slug`, `category`, `playerType`, `status`, `durations`, `protocolId`, `audioAvailable`, `silentModeAvailable`, `curatorId`, `safetyInstructions`)
- Players reutilizáveis escolhidos por `playerType`: `BreathingPlayer`, `GroundingPlayer`, `AwarenessPlayer`
- Parâmetros (ciclos, inspirar/segurar/expirar, passos, instruções, duração) vêm de `practice-protocols`, em segundos reais — não os tempos acelerados do protótipo
- Controles: iniciar, pausar, continuar, reiniciar, encerrar, modo silencioso quando disponível; respeita `prefers-reduced-motion`

## Contratos preparados para Fases 3 e 4

- `EmotionSession` completo (incluindo `emotionAfterId`, `intensityAfter`, `perceivedChangeIds`, `usefulness`, `stressMapId`, `actionReflectionId`, `status`, timestamps)
- Componentes/telas stub já roteados e desabilitados visualmente: `JourneyCheckout`, `StressMapWizard`, `ActionReflectionWizard`, `MinhaJornada` (Minha semana / Meus padrões / O que costuma me ajudar / Paisagem Emocional)
- `landscape-coordinates` fica como arquivo de configuração vazio/aguardando curadoria — nenhuma coordenada inventada
- `SafetyCheck` como camada separada, stub sem regra própria

## Detalhes técnicos

Estrutura de arquivos:

```text
src/features/jornada/
  config/  emotion-taxonomy.ts, landscape-coordinates.ts, practices.ts,
           practice-protocols.ts, recommendation-rules.ts, context-questions.ts,
           stress-map-options.ts, perceived-change-options.ts
  domain/  types.ts (EmotionSession, Practice, RecommendationRule, ...)
  engine/  recommend.ts (função pura), decision.ts
  state/   journeyReducer.ts, JourneyProvider.tsx (máquina de estados única)
  analytics/ events.ts, track.ts
  components/ EmotionWheel, EmotionWheelMobile, EmotionListFallback,
              IntensityScale, ContextQuestion, RecommendationCard, WhyThisPractice,
              CuratorCard, players/*, stubs Fase 3-4
  pages/   JornadaHome.tsx, JornadaSessao.tsx
```

- Estado: um único reducer com estágios (`entry → wheel → intensity → context? → recommendation → practice → checkout`), transições explícitas para evitar estados impossíveis; voltar/alterar emoção/intensidade/prática re-emite eventos no reducer
- Persistência do protótipo: `sessionStorage` (retomar jornada iniciada) com camada `sessionRepository` trocável por Supabase depois
- Analytics: `track(event, props)` no-op logado em dev, com todos os eventos listados no pedido e propriedades de versão (taxonomia, regra, prática); nenhuma chamada de rede nesta fase
- Visual: tokens semânticos existentes (roxo estrutural, turquesa destaque, rosa acento), muito branco, cards suaves, sombras discretas, sem novas classes de cor hard-coded; Buddy apenas como elemento de acolhimento secundário
- Sem migrações de banco, sem edge functions, sem IA nesta fase

## Fora de escopo agora

Fases 3 e 4 funcionais (checkout com registro, Mapa do Estresse, Agir, Minha Jornada com dados), persistência em Supabase e alertas/agregados institucionais.
