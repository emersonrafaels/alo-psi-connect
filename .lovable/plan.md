## Objetivo

Duas frentes:

1. **Correção rápida**: trocar todas as ocorrências visíveis de "Sleep Hours" por "Horas de sono" (minúsculo no "sono", seguindo o padrão do projeto).
2. **Evolução do Diário Emocional** seguindo o roadmap proposto, começando pela **Fase 1 (UX) + reestruturação dos insights de IA**, que é a melhoria de maior impacto e menor esforço. As fases 2–4 ficam mapeadas para sprints seguintes.

---

## Parte 1 — Correção: "Sleep Hours" → "Horas de sono"

O texto literal "Sleep Hours" não está hard-coded em nenhum arquivo `.tsx`. Ele aparece porque o **modelo de IA** (edge function `generate-mood-insights`) às vezes responde com termos em inglês, mesmo com prompt em PT-BR. Onde o termo aparece em inglês na UI:

- **Edge function `generate-mood-insights/index.ts`**: reforçar no `systemPrompt` que toda métrica deve ser citada em PT-BR (ex.: "Horas de sono", "Qualidade do sono", "Humor", "Energia", "Ansiedade") e proibir explicitamente termos como "Sleep Hours", "Mood Score", "Energy Level".
- **`FormattedInsightText.tsx`**: adicionar uma camada de pós-processamento que substitui termos remanescentes em inglês ("Sleep Hours" → "Horas de sono", "Sleep Quality" → "Qualidade do sono", "Mood Score" → "Humor", "Energy Level" → "Energia", "Anxiety Level" → "Ansiedade"), garantindo a consistência mesmo se a IA escorregar.
- Padronizar os labels já em PT-BR no projeto: `MoodEntry.tsx` e `MoodExperience.tsx` usam "Horas de Sono" (com "S" maiúsculo) — alinhar para "Horas de sono" (minúsculo), conforme padrão de capitalização do site.

---

## Parte 2 — Fase 1 do roadmap (UX + Insights)

### 2.1. Reestruturar Insights de IA em cards (alta prioridade)

Hoje o insight é um blob de markdown renderizado pelo `FormattedInsightText`. Vamos transformar em **JSON estruturado**.

**Edge function `generate-mood-insights`**:
- Migrar para Lovable AI Gateway (`LOVABLE_API_KEY`, modelo `google/gemini-2.5-flash`) — mais barato, e já é o padrão do projeto. Manter compatibilidade com OpenAI como fallback.
- Pedir resposta em **JSON estruturado** (via `response_format` / structured output):
  ```json
  {
    "summary": "string curta",
    "positive_patterns": ["..."],
    "attention_points": ["..."],
    "possible_triggers": ["..."],
    "suggested_actions": ["..."],
    "detected_themes": ["trabalho", "sono", ...],
    "risk_level": "healthy|attention|alert|critical",
    "confidence": "very_low|low|medium|high"
  }
  ```
- Calcular `confidence` no backend baseado em `entries_count`:
  - 0–2: `very_low` · 3–5: `low` · 6–10: `medium` · 11+: `high`
- Salvar em `ai_insights_history.insight_content` como JSON (string), mantendo retrocompatibilidade: se for texto markdown legado, renderizar como hoje; se for JSON válido, renderizar como cards.

**Frontend — novo componente `StructuredInsightView.tsx`**:
- Cards visuais separados: **Resumo**, **Padrões positivos** (✅), **Pontos de atenção** (⚠️), **Possíveis temas/gatilhos**, **Sugestões para os próximos dias** (lista numerada), **Confiança da análise** (badge colorido + tooltip explicando).
- Quando `confidence` for `very_low` ou `low`, exibir aviso: *"Ainda há poucos registros para conclusões mais fortes."*
- `AIInsightsCard.tsx` passa a usar `StructuredInsightView` quando o insight é JSON; cai em `FormattedInsightText` no fallback.

### 2.2. Card "Como você tem estado?" no topo de `MoodHistory` e `MoodAnalytics`

Novo componente `EmotionalSummaryCard.tsx`:
- Calcula a partir das últimas N entradas (default 7 dias):
  - Médias de humor, energia, ansiedade, sono e qualidade do sono.
  - Tendência (subindo/estável/oscilando/caindo) comparando metade recente vs. anterior.
  - Top 2 emoções complementares mais altas e top 2 mais baixas (das `emotion_values`).
- Exibe:
  - Título: "Como você tem estado?"
  - Linha de status: "Tendência geral: Estável com pontos de atenção" (derivado).
  - Bullets coloridos: ✅ pontos positivos · ⚠️ pontos de atenção · 💡 sugestão leve.
- Reutiliza tokens HSL de `--chart-1..5` e o status dot padrão da memória de triagem (sem triângulos/linhas tracejadas).

### 2.3. Histórico mais leve (`MoodHistory.tsx`)

- **Indicadores principais** sempre visíveis: Humor, Energia, Ansiedade, Horas de sono, Qualidade do sono.
- **Emoções complementares** (esperança, foco, gratidão, confiança, motivação, criatividade, produtividade, estresse, satisfação) recolhidas em um `Collapsible` com label "Ver dimensões emocionais".
- Mensagem do Buddy e reflexão livre permanecem visíveis.
- Tags/temas detectados aparecem como `Badge` abaixo da reflexão.
- Trocar "Sono:" por "Horas de sono:" no bloco já existente (linha 313).

### 2.4. Interpretação automática nos gráficos (`MoodAnalytics.tsx`)

Abaixo de cada gráfico (Tendência 30d, Tendências semanais, Distribuição), adicionar uma frase curta gerada por uma função pura `generateChartCaption(metric, series)`:
- Detecta direção (subindo/caindo/estável/oscilando), variação, faixas predominantes.
- Exemplos: "Seu humor subiu nos últimos registros, enquanto a ansiedade permaneceu baixa."
- Sem chamada de IA — pura heurística no cliente, rápida e gratuita.

### 2.5. Score de confiança visível

Componente `ConfidenceBadge.tsx` reutilizável (badge + tooltip), usado nos insights e no card "Como você tem estado?". Usa as faixas definidas acima.

---

## Parte 3 — Fases 2–4 (mapeadas, não implementadas agora)

Documentadas em `.lovable/plan.md` como referência para próximas sprints:

- **Fase 2 — Inteligência personalizada**: temas recorrentes, detecção de tendências por métrica, comparação registro atual vs. anterior, Buddy com memória contextual, check-in baseado nas emoções configuradas pelo usuário.
- **Fase 3 — Acompanhamento contínuo**: página "Meu padrão emocional", visão semanal agrupada, modo rápido/profundo de check-in, metas leves de consistência, filtros avançados no histórico, exportação de relatório pessoal.
- **Fase 4 — Camada institucional**: dashboards profissionais, alertas de acompanhamento, relatórios anonimizados, protocolos de encaminhamento.

---

## Detalhes técnicos

### Arquivos a criar
- `src/components/mood/EmotionalSummaryCard.tsx`
- `src/components/mood/StructuredInsightView.tsx`
- `src/components/mood/ConfidenceBadge.tsx`
- `src/utils/moodInsightHelpers.ts` (cálculo de tendências, captions de gráficos, parsing JSON dos insights com fallback)

### Arquivos a editar
- `supabase/functions/generate-mood-insights/index.ts` — migrar para Lovable AI Gateway, output estruturado JSON, glossário PT-BR no prompt.
- `src/hooks/useAIInsights.tsx` — tipar resposta como `StructuredInsight | string`.
- `src/components/AIInsightsCard.tsx` — escolher renderer (estruturado vs. markdown legado).
- `src/components/FormattedInsightText.tsx` — sanitização de termos em inglês remanescentes.
- `src/pages/MoodHistory.tsx` — `EmotionalSummaryCard` no topo, indicadores principais + collapsible para complementares, label "Horas de sono".
- `src/pages/MoodAnalytics.tsx` — captions automáticas abaixo de cada gráfico, `EmotionalSummaryCard` no topo.
- `src/pages/MoodEntry.tsx` e `src/pages/MoodExperience.tsx` — label "Horas de sono" (capitalização padronizada).

### Banco de dados
Sem migrações nesta fase. `ai_insights_history.insight_content` continua `text`; armazenamos JSON serializado (parse no frontend, com fallback para markdown).

### Compatibilidade
- Insights antigos (markdown) continuam renderizados por `FormattedInsightText`.
- Novos insights (JSON) renderizados por `StructuredInsightView`.
- Detecção via `try { JSON.parse(content) }`.

### Não-objetivos desta sprint
- Não criamos novas tabelas (`mood_period_analyses`, `emotion_patterns`, etc.) — vai para Fase 2.
- Não alteramos o fluxo do WhatsApp/Evolution.
- Não mexemos em RLS.

---

## Critérios de aceite

1. Nenhum insight novo exibe "Sleep Hours", "Mood Score" ou outros termos em inglês — mesmo se a IA gerar, a sanitização garante PT-BR.
2. Labels do formulário do diário usam "Horas de sono" (capitalização padronizada).
3. No histórico, a primeira coisa que o usuário vê é o card "Como você tem estado?" com leitura humana do estado atual.
4. Cada card de entrada mostra primeiro os 5 indicadores principais; emoções complementares ficam num "Ver dimensões emocionais".
5. Insights aparecem em cards estruturados (Resumo, Positivos, Atenção, Sugestões, Confiança), com badge de confiança visível.
6. Cada gráfico em `MoodAnalytics` tem uma frase curta abaixo explicando a tendência.
7. O tom segue o padrão Rede Bem-Estar: acolhedor, não clínico, sem diagnosticar.
