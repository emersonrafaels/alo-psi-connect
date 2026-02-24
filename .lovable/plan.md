

## Exibir todas as emocoes preenchidas dinamicamente no Diario Emocional

### Problema

A pagina `MoodDiary.tsx` exibe apenas 3 emocoes fixas (Humor, Energia, Ansiedade), usando campos legados (`mood_score`, `energy_level`, `anxiety_level`). Porem os usuarios podem ter configurado emocoes diferentes (ex: foco, motivacao, estresse). Quando uma dessas 3 emocoes fixas nao esta preenchida, aparece "/10" ou "/5".

### Dados do banco confirmam

Entradas recentes possuem `emotion_values` com emocoes variadas:
- `{anxiety:1, focus:2, mood:4, motivation:4, stress:2}` (sem energy)
- `{anxiety:2, energy:1, focus:2, mood:2, motivation:1, stress:2}` (6 emocoes)
- `{anxiety:1}` (apenas 1 emocao)

### Solucao

Substituir as 3 linhas fixas por renderizacao dinamica usando `getAllEmotions()`, que ja existe em `emotionFormatters.ts`. Esta funcao:
1. Le todas as emocoes de `emotion_values`
2. Faz fallback para campos legados se `emotion_values` estiver vazio
3. Retorna nome, valor e emoji de cada emocao preenchida

### Alteracoes no arquivo `src/pages/MoodDiary.tsx`

**1. Importar `getAllEmotions` e `getEmotionDisplayName`**

Adicionar ao import existente de `emotionFormatters`.

**2. Card "Entrada de hoje" (linhas 235-238)**

Trocar as 3 spans fixas por um map dinamico:

```tsx
<div className="flex gap-4 flex-wrap">
  {getAllEmotions(todayEntry, userConfigs).map(emotion => (
    <span key={emotion.key} className="text-sm">
      <strong>{emotion.name}:</strong> {emotion.value.toFixed(1)}/5
    </span>
  ))}
</div>
```

**3. Lista "Entradas Recentes" (linhas 372-375)**

Mesma abordagem dinamica:

```tsx
<div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
  {getAllEmotions(entry, userConfigs).map(emotion => (
    <span key={emotion.key}>{emotion.name}: {emotion.value.toFixed(1)}/5</span>
  ))}
</div>
```

**4. Indicador de cor (linhas 379-383)**

Usar a primeira emocao disponivel (ou mood se existir) para o indicador de cor, com fallback para `bg-muted` se nenhuma emocao existir.

**5. Card de estatisticas "Humor Medio"**

Ajustar para calcular a media a partir de `emotion_values.mood` quando `mood_score` for null, usando `getEmotionValue`.

### Resultado esperado

- Todas as emocoes preenchidas aparecem na listagem (nao apenas 3 fixas)
- Nenhum valor "/5" ou "/10" vazio -- so mostra emocoes que tem dados
- Nomes corretos via configuracao do usuario (ex: "Foco" em vez de "focus")

