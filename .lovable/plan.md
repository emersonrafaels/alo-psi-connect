## Goal
Tornar cada item da seção "Entradas Recentes" em `/diario-emocional` clicável, abrindo um modal com o registro completo da entrada e a análise de IA correspondente (quando existir).

## Mudanças

### 1. Novo componente `src/components/mood/MoodEntryDetailModal.tsx`
- Props: `entry: MoodEntry | null`, `analysis?: MoodEntryAnalysis | null`, `open`, `onOpenChange`, `userConfigs`.
- Usa `Dialog` (`@/components/ui/dialog`) — `max-w-2xl`, scrollável.
- Conteúdo:
  - Cabeçalho: data formatada (pt-BR, longo) + badge de risk level (usando `RISK_LEVEL_META`) quando houver análise.
  - Seção "Emoções": grid com todas as emoções de `getAllEmotions(entry, userConfigs)` mostrando nome, valor inteiro `/escala` e barra/indicador de cor.
  - Seção "Sono": `sleep_hours` e `sleep_quality` quando presentes.
  - Seção "Diário": `journal_text` (renderizado em `whitespace-pre-wrap`); placeholder "Sem texto" se vazio.
  - Seção "Tags": chips a partir de `entry.tags`.
  - Seção "Análise da IA":
    - Se `analysis?.buddy_message` → exibir em card destacado (ícone Sparkles).
    - Mostrar `risk_level` com badge e label.
    - Se não houver análise → mensagem "Análise ainda não disponível para esta entrada".
- Sem chamadas extras à API; recebe os dados já carregados.

### 2. `src/pages/MoodDiary.tsx`
- Já carrega `analysesMap` via `useMoodEntryAnalyses(entryIds)` (verificar; se ausente, adicionar — análogo ao `MoodHistory.tsx`).
- Adicionar state `selectedEntry: MoodEntry | null` e abrir modal ao clicar no item.
- Tornar o `<div>` da entrada um `<button>`/div com `role="button"`, `cursor-pointer`, `hover:bg-muted/50`, `onClick={() => setSelectedEntry(entry)}` e `onKeyDown` (Enter/Space) para acessibilidade.
- Renderizar `<MoodEntryDetailModal entry={selectedEntry} analysis={selectedEntry ? analysesMap?.get(selectedEntry.id) : null} open={!!selectedEntry} onOpenChange={(o) => !o && setSelectedEntry(null)} userConfigs={userConfigs} />` no fim do componente.

### 3. (Opcional, escopo mínimo)
- Mostrar pequeno ícone de risco (bolinha já existe) inalterado; o modal substitui a necessidade de outras affordances.

## Notas técnicas
- Reaproveitar utilitários existentes: `getAllEmotions`, `parseISODateLocal`, `RISK_LEVEL_META`, `useMoodEntryAnalyses`.
- Nada muda no banco; apenas UI client-side.
- Tipos: importar `MoodEntry` de `@/hooks/useMoodEntries` e `MoodEntryAnalysis` de `@/hooks/useMoodEntryAnalyses`.
