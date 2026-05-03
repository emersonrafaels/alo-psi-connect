# Dashboard versátil do Diário Emocional

Tornar os gráficos de **Análises** (`MoodAnalytics`) e **Meu Padrão Emocional** (`MoodPattern`) verdadeiramente interativos, deixando o usuário escolher quais emoções acompanhar, ver correlações entre elas e ter uma visão de "dashboard da vida".

Hoje os gráficos usam apenas 3-4 métricas fixas (humor, energia, ansiedade, sono) e ignoram o restante das emoções configuráveis (`emotion_values` em `mood_entries` + `emotion_configurations`).

---

## O que será adicionado

### 1. Seletor multi-emoção (componente reutilizável)
Novo componente `src/components/mood/EmotionMultiSelect.tsx`:
- Lê `userConfigs` (ativos) via `useEmotionConfig`
- Renderiza chips/toggles coloridos com o `display_name` e emoji médio de cada emoção
- Permite ligar/desligar cada série exibida no gráfico
- Persiste a seleção em `localStorage` (`mood-dashboard:selected-emotions`)
- Usa as cores do `color_scheme` de cada emoção para manter consistência

### 2. Helper unificado de séries
Novo `src/utils/moodSeriesBuilder.ts`:
- Recebe `entries` + `userConfigs` + `range (7/30/90)` + `granularity (day|week)`
- Une métricas legadas (`mood_score`, `energy_level`, `anxiety_level`, `sleep_quality`) com `emotion_values` dinâmicos em uma única estrutura `{ date, [emotionType]: number }`
- Produz também versões agregadas (média semanal) e normalizadas 0-1 (necessário para correlações entre escalas diferentes)

### 3. Gráfico de tendências reformulado
Em `MoodAnalytics.tsx` e `MoodPattern.tsx`:
- Substituir o `LineChart` fixo por um gráfico que renderiza N linhas dinamicamente conforme o `EmotionMultiSelect`
- Toggle de granularidade: `Diário | Semanal`
- Toggle de janela: `7d | 30d | 90d` (já existe em MoodPattern, replicar em Analytics)
- Tooltip mostra o emoji do valor exato (usando `emoji_set` da config)

### 4. Mapa de correlação entre emoções
Novo componente `src/components/mood/EmotionCorrelationMatrix.tsx`:
- Calcula coeficiente de Pearson entre pares das emoções selecionadas (usando valores normalizados)
- Renderiza um heatmap (grid de células com cor `--chart-*` em escala divergente vermelho↔verde)
- Tooltip explica em linguagem simples: "Quando seu sono melhora, sua ansiedade tende a diminuir (corr. -0.62)"
- Requer mínimo de 5 entradas com ambos valores presentes; abaixo disso mostra estado vazio amigável

### 5. Card "Dispersão / relação entre 2 emoções"
Novo componente `src/components/mood/EmotionScatterCard.tsx`:
- Dois selects (eixo X e eixo Y) entre as emoções ativas
- `ScatterChart` do Recharts mostrando cada entrada como ponto
- Linha de tendência simples (regressão linear) e legenda da força da correlação

### 6. Ranking "Suas emoções no período"
Novo componente `src/components/mood/EmotionRankingCard.tsx`:
- Lista cada emoção ativa com: média, variação vs. período anterior (seta + cor verde/vermelha respeitando se "alto é bom" — ansiedade/estresse invertem), mini-sparkline
- Botão "Adicionar ao gráfico" que ativa aquela emoção no `EmotionMultiSelect`

### 7. Dashboard reorganizado
Reescrever o layout de `MoodAnalytics.tsx` e enxugar duplicação com `MoodPattern.tsx`:

```text
[ Header + range 7/30/90 + granularidade ]
[ Resumo emocional (existente) ]
[ EmotionMultiSelect — chips coloridos ]
[ Gráfico de tendências dinâmico ]
[ EmotionRankingCard ]   [ EmotionCorrelationMatrix ]
[ EmotionScatterCard (X vs Y) ]
[ Distribuição do humor (existente) | Tags mais frequentes (existente) ]
[ AIInsightsCard (existente) ]
[ Observações rápidas (existente) ]
```

`MoodPattern.tsx` recebe os mesmos componentes (multi-select + correlação + scatter), mantendo o foco em "padrão" e o export PDF.

---

## Detalhes técnicos

- **Fonte de dados**: `useMoodEntries().entries` (já traz `emotion_values`) + `useEmotionConfig().activeConfigs`. Nenhuma migração de banco necessária.
- **Normalização**: `(valor - scale_min) / (scale_max - scale_min)` por emoção, para permitir comparações entre escalas diferentes.
- **Pearson**: implementar inline em `moodSeriesBuilder.ts` (sem dependência nova). Ignora pares sem ambos valores no mesmo dia.
- **Cores**: usar `color_scheme.mid` de cada `EmotionConfig` como cor da linha/série; fallback para `--chart-1..5`.
- **Acessibilidade**: chips do multi-select são `<button role="switch" aria-checked>`.
- **Performance**: memoizar séries com `useMemo` baseado em `[entries, userConfigs, selected, range, granularity]`.
- **Empty states**: cada novo card tem mensagem amigável quando faltam dados (mín. 5 entradas para correlação, 3 para sparkline).

---

## Arquivos

**Criar**
- `src/components/mood/EmotionMultiSelect.tsx`
- `src/components/mood/EmotionCorrelationMatrix.tsx`
- `src/components/mood/EmotionScatterCard.tsx`
- `src/components/mood/EmotionRankingCard.tsx`
- `src/utils/moodSeriesBuilder.ts`

**Editar**
- `src/pages/MoodAnalytics.tsx` — novo layout + integração dos componentes
- `src/pages/MoodPattern.tsx` — adicionar multi-select, correlação e scatter; reaproveitar `moodSeriesBuilder`

Sem alterações no Supabase nem novas dependências.