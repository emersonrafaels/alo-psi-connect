# Cores distintas por emoção + reestruturação de "Meu padrão emocional"

## Parte 1 — Cor distinta por linha do gráfico

**Problema:** Hoje `getEmotionColor` em `src/utils/moodSeriesBuilder.ts` usa `color_scheme.mid` da config da emoção. Confirmado no banco: o `mid` de praticamente todas as emoções é `hsl(45, 100%, 50%)` (amarelo — pensado para o ponto médio do slider, não para gráficos). Resultado: todas as linhas saem amarelas.

**Solução:** Substituir a função por uma **paleta determinística por `emotion_type`**, ignorando `color_scheme.mid`. Cada emoção conhecida tem uma cor própria e legível em modo claro/escuro; emoções customizadas recebem cor estável via hash sobre uma paleta de fallback.

Paleta proposta (todas em HSL semântico):

| Emoção        | Cor          |
|---------------|--------------|
| Humor         | verde        |
| Energia       | laranja      |
| Ansiedade     | vermelho     |
| Estresse      | carmim       |
| Motivação     | violeta      |
| Foco          | azul         |
| Gratidão      | rosa         |
| Confiança     | púrpura      |
| Esperança     | ciano        |
| Criatividade  | magenta      |
| Produtividade | teal         |
| Satisfação    | âmbar        |
| Qualidade do sono | índigo   |

Aplicada em: `DynamicTrendChart`, `EmotionMultiSelect` (chips), `EmotionRankingCard` (sparkline + bullet) e `EmotionScatterCard` (eixos/pontos).

**Arquivo alterado:** `src/utils/moodSeriesBuilder.ts` (somente a função `getEmotionColor`).

---

## Parte 2 — Reestruturação de "Meu padrão emocional"

**Problema:** Após a última iteração, `MoodPattern` ficou quase idêntica à `MoodAnalytics` — mesmo multi-select, mesmo gráfico de tendências, mesma matriz de correlação, mesmo scatter. A página perdeu identidade.

**Visão nova:** "Meu padrão emocional" deixa de ser "mais um dashboard" e passa a ser uma **leitura narrativa do que está acontecendo com você**, focada em:
1. Padrões recorrentes (não números crus)
2. Gatilhos e contextos (tags, dia da semana, sono)
3. Consistência e progresso
4. Exportação para compartilhar com profissional

Tudo que é "explorar livremente os números" continua em `MoodAnalytics` (Análises). Nada de matriz de correlação, scatter ou multi-select aqui.

### Nova estrutura da página

```text
[ Header: voltar | "Meu padrão emocional" | range 7d/30d/90d | Exportar PDF ]

┌─ Como você tem estado ─────────────────────────────────────────┐
│ EmotionalSummaryCard (já existe — narrativa: tendência geral,  │
│ pontos positivos, pontos de atenção, sugestão)                 │
└─────────────────────────────────────────────────────────────────┘

┌─ Sua história nos últimos N dias ──────────────────────────────┐
│ NOVO: PatternNarrativeCard                                     │
│  • 3-5 frases geradas localmente a partir dos dados:           │
│    "Nos últimos 30 dias seu humor melhorou 12%."               │
│    "Suas semanas com mais sono tendem a ter menos ansiedade."  │
│    "Quartas-feiras costumam ser seus piores dias para foco."   │
│    "Você manteve registros em 22 de 30 dias."                  │
│  • Tom acolhedor, foco em padrão, não em ranking               │
└─────────────────────────────────────────────────────────────────┘

┌─ Ritmo da semana ─────────────┐  ┌─ Hora/dia mais estáveis ───┐
│ NOVO: WeekdayHeatmapCard      │  │ NOVO: ConsistencyCalendar  │
│ Para cada dia da semana       │  │ Calendário do período com  │
│ (seg→dom), barras horizontais │  │ ponto colorido por dia     │
│ com média de humor, energia,  │  │ (verde=registrou +humor    │
│ ansiedade — revela "minhas    │  │ alto, cinza=sem registro)  │
│ segundas pesam"               │  │ Mostra streak atual        │
└───────────────────────────────┘  └────────────────────────────┘

┌─ Temas que voltam ────────────┐  ┌─ Meta de consistência ─────┐
│ RecurringThemes (já existe)   │  │ ConsistencyGoalCard (existe)│
└───────────────────────────────┘  └────────────────────────────┘

┌─ O que parece ajudar / pesar ──────────────────────────────────┐
│ NOVO: TagImpactCard                                            │
│ Para cada tag frequente (≥3 ocorrências):                      │
│   "🌧️ Dias com 'trabalho': humor médio 2.8 (vs. 3.6 geral)"   │
│   "🌟 Dias com 'exercício': humor médio 4.2 (+0.6)"           │
│ Ordenado por impacto absoluto, ↑ verde / ↓ vermelho            │
└─────────────────────────────────────────────────────────────────┘

┌─ Última análise da IA ─────────────────────────────────────────┐
│ Mostra latestInsight existente (ai_insights_history)           │
│ Botão "Ver no Diário" → /diario-emocional/analises             │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes a criar

1. **`PatternNarrativeCard`** (`src/components/mood/PatternNarrativeCard.tsx`)
   - Recebe `entries`, `userConfigs`, `days`
   - Gera frases localmente a partir de: variação % de cada emoção vs. período anterior, pior dia da semana, melhor dia da semana, taxa de registro, correlação sono↔ansiedade quando significativa
   - Sem chamada de IA

2. **`WeekdayHeatmapCard`** (`src/components/mood/WeekdayHeatmapCard.tsx`)
   - Para cada dia da semana, calcula médias das 3-4 emoções principais ativas do usuário
   - Mostra barras horizontais coloridas (cores da paleta da Parte 1)
   - Destaca o pior e melhor dia da semana

3. **`ConsistencyCalendar`** (`src/components/mood/ConsistencyCalendar.tsx`)
   - Grid simples (7 colunas × N semanas) cobrindo o período selecionado
   - Cada célula colorida pelo `mood_score` do dia (verde alto, cinza sem registro)
   - Tooltip com data e principais métricas
   - Cabeçalho mostra: streak atual, taxa de registro

4. **`TagImpactCard`** (`src/components/mood/TagImpactCard.tsx`)
   - Agrupa entradas por tag (precisa ≥3 ocorrências da tag no período)
   - Calcula humor médio em dias com a tag vs. média geral do período
   - Lista ordenada por |delta|, ícone ↑/↓ e cor (verde se melhora, vermelho se piora)

### Componentes a remover de `MoodPattern.tsx`

- `EmotionMultiSelect`
- `DynamicTrendChart`
- `EmotionRankingCard`
- `EmotionCorrelationMatrix`
- `EmotionScatterCard`

(Continuam exclusivos da página `MoodAnalytics`.)

### Componentes que continuam em `MoodPattern.tsx`

- `EmotionalSummaryCard`
- `RecurringThemes`
- `ConsistencyGoalCard`
- Header + range tabs + botão Exportar PDF (`exportMoodReportPDF`)

### Diferenciação clara entre as duas páginas

| Página | Foco | Interação |
|---|---|---|
| **Análises** (`/diario-emocional/analises`) | Explorar livremente: escolher emoções, comparar séries, ver correlação e dispersão | Alta — multi-select, scatter, granularidade |
| **Meu padrão emocional** (`/diario-emocional/padrao`) | Ler a sua história: o que se repete, quando piora, o que ajuda, exportar | Baixa — só range + export |

---

## Resumo de arquivos

**Editar**
- `src/utils/moodSeriesBuilder.ts` — nova `getEmotionColor` (paleta por emoção)
- `src/pages/MoodPattern.tsx` — reestruturar layout, remover componentes do dashboard, adicionar os 4 novos cards

**Criar**
- `src/components/mood/PatternNarrativeCard.tsx`
- `src/components/mood/WeekdayHeatmapCard.tsx`
- `src/components/mood/ConsistencyCalendar.tsx`
- `src/components/mood/TagImpactCard.tsx`

Sem migração de banco, sem dependência nova.