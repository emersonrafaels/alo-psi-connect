

## Ajustar card de Humor Médio: escala /5 + seletor de emoções

### Problema
O card "Humor Médio (7 dias)" mostra `/10` fixo e não permite alternar entre as diferentes emoções configuradas pelo usuário.

### Solução

**Arquivo: `src/pages/MoodDiary.tsx`**

1. **Adicionar estado** `selectedStatEmotion` (default: `'mood'`) para controlar qual emoção está exibida no primeiro card.

2. **Substituir o card fixo** por um card dinâmico que:
   - Usa um `Select` dropdown no header para escolher entre as emoções ativas do usuário (vindas de `activeConfigs` do `useEmotionConfig`)
   - Calcula a média com base na emoção selecionada usando `getEmotionValue` com a key correspondente
   - Exibe a escala correta (`/5`) baseada no `scale_max` da config da emoção selecionada (em vez do `/10` hardcoded)

3. **Lógica de cálculo**:
   - Buscar o `scale_max` da emoção selecionada em `activeConfigs`
   - Usar `calculateAverage` com os valores das últimas 7 entradas para a emoção selecionada
   - Mapear emotion_type para legacy fields quando aplicável (mood→mood_score, energy→energy_level, anxiety→anxiety_level)

### Imports adicionais
- `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` de `@/components/ui/select`
- Usar `activeConfigs` do hook `useEmotionConfig` (já importado)

### Resultado
O card mostrará "Humor Médio (7 dias)" por padrão com escala `/5`, mas permitirá trocar para qualquer emoção configurada (Ansiedade, Energia, Estresse, Motivação, Foco) via dropdown.

