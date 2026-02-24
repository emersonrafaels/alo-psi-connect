

## Corrigir valores nulos exibidos como "/" no Diario Emocional

### Problema

Na pagina do Diario Emocional (`MoodDiary.tsx`), os campos `mood_score`, `energy_level` e `anxiety_level` sao exibidos diretamente como `{entry.mood_score}/10`, sem tratamento de null. Quando o usuario nao configurou a emocao "mood" (humor), o campo fica `null` no banco e a interface mostra apenas "/10" sem numero.

Isso acontece em dois locais:
1. Card "Entrada de hoje" (linha 236-238)
2. Lista "Entradas Recentes" (linhas 373-375)

### Causa raiz

O campo `mood_score` e preenchido a partir de `emotion_values['mood']` ao salvar (linha 87 do MoodEntry.tsx). Se o usuario nao tem a emocao "mood" habilitada, o valor fica `null`. O mesmo ocorre com `energy_level` e `anxiety_level`.

Ja existe um utilitario `formatEmotionValue` em `emotionFormatters.ts` que faz o fallback correto (busca em `emotion_values` primeiro, depois campo legado, e retorna "N/A" se nulo). Porem `MoodDiary.tsx` nao o utiliza.

### Solucao

Atualizar `MoodDiary.tsx` para usar `formatEmotionValue` nos dois locais de exibicao:

**Arquivo: `src/pages/MoodDiary.tsx`**

1. Adicionar import de `formatEmotionValue` de `@/utils/emotionFormatters`

2. No card "Entrada de hoje" (linhas 236-238), trocar:
   - `{todayEntry.mood_score}/10` por `{formatEmotionValue(todayEntry, 'mood', 'mood_score', 10)}`
   - `{todayEntry.energy_level}/5` por `{formatEmotionValue(todayEntry, 'energy', 'energy_level')}`
   - `{todayEntry.anxiety_level}/5` por `{formatEmotionValue(todayEntry, 'anxiety', 'anxiety_level')}`

3. Na lista "Entradas Recentes" (linhas 373-375), trocar:
   - `{entry.mood_score}/10` por `{formatEmotionValue(entry, 'mood', 'mood_score', 10)}`
   - `{entry.energy_level}/5` por `{formatEmotionValue(entry, 'energy', 'energy_level')}`
   - `{entry.anxiety_level}/5` por `{formatEmotionValue(entry, 'anxiety', 'anxiety_level')}`

4. Corrigir o indicador de cor do mood (linha 380) para tratar null:
   - Usar `getEmotionValue(entry, 'mood', 'mood_score')` com fallback para cor neutra

### Resultado esperado

- Entradas com valores preenchidos: exibem normalmente (ex: "4/10", "3/5")
- Entradas com valores nulos: exibem "N/A" em vez de "/10" ou "/5"
- Busca primeiro em `emotion_values`, depois no campo legado, garantindo compatibilidade

