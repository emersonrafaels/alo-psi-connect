# Jornada de Autorregulação: símbolos modernos + página inteligente em dados

## 1. Símbolos da Roda (ícones de linha)

Trocar os glifos (▲ ◆ ▼ ★ ✖ ✦) por ícones de linha no estilo da referência, renderizados dentro do SVG da roda em círculos translúcidos:

| Família | Ícone |
|---|---|
| Raiva | Zap |
| Medo | Shield |
| Tristeza | Droplet |
| Alegria | Sun |
| Surpresa | Star |
| Nojo | Waves |

- Um registry único (`family-icons.ts`) devolve o componente do ícone por família, usado na roda, nos chips de trilha, nos badges e nos painéis laterais — nada mais usa emoji.
- Na roda, o ícone fica em um disco de fundo semitransparente acima do rótulo, com espaçamento calculado para que ícone e texto nunca se sobreponham (regra que já vale hoje) e traço fino (strokeWidth 1.75) para leitura moderna.
- Núcleo central passa a mostrar o ícone da família selecionada, no lugar do emoji.

## 2. Novo layout (seguindo a referência)

A tela vira um cabeçalho imersivo + roda ao centro + trilha lateral, mantendo o fluxo em 8 etapas abaixo:

```text
┌───────────────────────────────────────────────────────────────┐
│ Como você está agora?      [ RODA ]      Explorar pela Roda   │
│ texto curto + Buddy                      Responder rapidinho  │
│                                          Ir para a biblioteca │
│                                          ── Curadoria: Anne ──│
├───────────────────────────────────────────────────────────────┤
│ Práticas em destaque (3 cards com play e duração)             │
├───────────────────────────────────────────────────────────────┤
│ Stepper + etapas 3..8 (intensidade, contexto, prática, ...)   │
└───────────────────────────────────────────────────────────────┘
```

- Herói com gradiente suave, título grande "Como você está agora?", subtítulo curto e o mascote Buddy à esquerda.
- Roda ao centro, maior, com dica "Passe o mouse ou clique em uma emoção".
- Três atalhos à direita (Roda das Emoções / Responder rapidinho — vai direto para intensidade com a última emoção sugerida / Biblioteca de práticas).
- Card de curadoria da Anne Kaufmann com selo verificado (mantém o hook atual).
- Faixa "Práticas em destaque" com duração e botão de play.
- Etapas seguintes (intensidade → concluir) permanecem, com cards mais leves e o stepper compacto e fixo no topo da área do fluxo.

## 3. Inteligência de dados

Três camadas de sinais, cada uma com fallback silencioso quando não há dados ou usuário deslogado:

1. **Diário emocional** — lê os registros recentes do usuário e mostra um card "Seu momento" com tendência dos últimos 7 dias e um atalho "Começar por [emoção mais provável]", pré-selecionando família/emoção na roda.
2. **Histórico de jornadas** — nova tabela `journey_sessions` grava cada sessão concluída (emoção, intensidade inicial/final, prática, mudança percebida). Alimenta: "suas emoções mais frequentes", "prática que mais te ajudou" e reordenação das recomendações a favor do que funcionou.
3. **Agregados anônimos** — função no banco que devolve, por emoção, as práticas mais concluídas e a variação média de intensidade. Vira um selo de prova social no card de recomendação ("87% relataram alívio") e um bloco "o que ajuda quem sente o mesmo".

Além disso, um painel "O que mudou" ao final compara a intensidade antes/depois e o histórico, com o mesmo padrão visual de métricas já usado no projeto (ponto colorido de status, sem triângulos ou barras empilhadas).

## Detalhes técnicos

- `src/features/jornada/config/family-icons.ts`: mapa `familyId -> LucideIcon`; `family-emojis.ts` é removido e os 4 pontos de uso migrados.
- `EmotionWheel.tsx`: ícone via `<g transform>` com `foreignObject` evitado — usa o `iconNode` do lucide desenhado como `<path>` dentro do SVG, garantindo escala nítida; posicionamento radial já existente reutilizado, com raio do ícone e do rótulo separados por folga fixa.
- Migração SQL: `journey_sessions` (user_id nullable para convidado, emotion_id, intensity_before, intensity_after, practice_id, perceived_change, tenant_id, created_at) + `GRANT` para `authenticated`/`service_role`/`anon` conforme políticas + RLS (dono lê/escreve; insert de convidado permitido sem user_id).
- Função `security definer` `journey_practice_stats(emotion_id)` retornando agregados anônimos (mínimo de 5 sessões para exibir, senão oculta o selo).
- Novos hooks: `useJourneyHistory`, `useJourneyAggregates`, e reuso de `useMoodEntries` para o card "Seu momento".
- `recommend.ts` ganha um parâmetro opcional de reforço (histórico + agregados) que só reordena empates, mantendo o motor determinístico.
- Persistência: `sessionRepository` ganha implementação Supabase para gravar a sessão concluída, mantendo o sessionStorage como cache local.
- Sem cores hardcoded: tudo por tokens semânticos e pela cor da família.
