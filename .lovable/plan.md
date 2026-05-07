## Problema

O conteúdo salvo em `ai_insights_history.insight_content` é um **JSON estruturado** (não markdown), com chaves como `summary`, `positive_patterns`, `attention_points`, `possible_triggers`, `suggested_actions`, `detected_themes`, `risk_level`, `confidence`. Atualmente o `InsightHistoryCard` joga o JSON cru dentro de `FormattedAIContent` (markdown renderer), resultando no texto bruto mostrado no print (`{"positive_patterns":[...`).

## Solução

Renderizar o insight como seções estruturadas quando o conteúdo for JSON, com fallback para markdown quando for texto puro (insights antigos podem ser strings).

### 1. Novo componente `src/components/ai/StructuredInsightView.tsx`

- Recebe `content: string`.
- Tenta `JSON.parse`. Se falhar (ou não tiver chaves esperadas), renderiza com `FormattedAIContent` (fallback).
- Se parsear OK, renderiza seções na ordem:
  1. **Cabeçalho de status**: badges com `risk_level` (cor por nível: `low`=verde, `attention`=âmbar, `medium`=laranja, `high/critical`=vermelho) + `confidence` (low/medium/high).
  2. **Resumo** (`summary`) — parágrafo destacado em card `bg-primary/5`.
  3. **Padrões positivos** (`positive_patterns[]`) — ícone Sparkles verde, lista de bullets.
  4. **Pontos de atenção** (`attention_points[]`) — ícone AlertCircle âmbar.
  5. **Possíveis gatilhos** (`possible_triggers[]`) — ícone Zap.
  6. **Ações sugeridas** (`suggested_actions[]`) — ícone Target/Lightbulb, lista numerada.
  7. **Temas detectados** (`detected_themes[]`) — chips/badges no rodapé.
- Cada seção só renderiza se o array existir e tiver itens.
- Tipografia consistente com o resto do app (text-sm, text-foreground/90, espaçamentos).

### 2. Helper de preview no `InsightHistoryCard`

- Atualizar `stripMarkdown` para também detectar JSON: se o conteúdo começar com `{` e parsear, retornar `summary` (ou concatenar primeiros 1–2 itens de `attention_points`) em vez do JSON cru.
- Renomear para `getInsightPreview`.

### 3. Substituir renderização expandida

- No `InsightHistoryCard.tsx`, trocar `<FormattedAIContent content={insight.insight_content} />` por `<StructuredInsightView content={insight.insight_content} />`.
- Aplicar a mesma troca em `src/pages/MoodPattern.tsx` (linha 151) para o "último insight", que tem o mesmo problema.

### 4. (Opcional, sem alterar dados) Manter compatibilidade

Insights antigos em texto/markdown puro continuam funcionando via fallback automático para `FormattedAIContent`.

## Arquivos afetados

- `src/components/ai/StructuredInsightView.tsx` (novo)
- `src/components/InsightHistoryCard.tsx` (preview + render expandido)
- `src/pages/MoodPattern.tsx` (render do último insight)

Sem migrações, sem mudanças em edge functions.