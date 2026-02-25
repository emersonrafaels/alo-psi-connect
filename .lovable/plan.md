

## Correcoes no Diario Emocional: formato inteiro e valores default

### Problema 1: Valores com casa decimal desnecessaria

Todos os valores de emocoes sao exibidos com `.toFixed(1)`, resultando em "4.0/5" em vez de "4/5". Como os valores sao sempre inteiros (sliders de 1 a 5), a casa decimal e desnecessaria.

**Locais afetados em `src/pages/MoodDiary.tsx`:**
- Linha 238: `emotion.value.toFixed(1)` no card "Entrada de hoje"
- Linha 376: `emotion.value.toFixed(1)` na lista "Entradas Recentes"

**Correcao:** Trocar `.toFixed(1)` por `Math.round()` nos dois locais.

---

### Problema 2: Emocoes default nao salvas

Quando o usuario cria uma nova entrada, o formulario inicializa `emotion_values` como `{}` vazio (linha 46 de MoodEntry.tsx). Os valores default so sao preenchidos se `checkExistingEntry` for chamado (linhas 160-163). No modo estatico atual, a inicializacao (linhas 260-265) nao chama essa funcao, entao o formulario fica com `emotion_values` vazio.

Se o usuario so move um slider (ex: energia), apenas esse valor e salvo em `emotion_values`. As demais emocoes ficam sem valor.

**Correcao em `src/pages/MoodEntry.tsx`:**

Na inicializacao (useEffect linha 260-265), apos verificar que user/profile estao carregados, inicializar `emotion_values` com os valores default de todas as emocoes ativas:

```typescript
useEffect(() => {
  if (!user || loading || !profile || configsLoading) {
    return;
  }
  // Inicializar emotion_values com defaults se estiver vazio
  if (Object.keys(formData.emotion_values).length === 0 && activeConfigs.length > 0) {
    const initialEmotionValues: Record<string, number> = {};
    activeConfigs.forEach(config => {
      initialEmotionValues[config.emotion_type] = Math.floor((config.scale_min + config.scale_max) / 2);
    });
    setFormData(prev => ({
      ...prev,
      emotion_values: initialEmotionValues,
    }));
  }
  setInitialized(true);
}, [user, profile, loading, configsLoading, activeConfigs]);
```

Isso garante que todas as emocoes configuradas tenham valor default ao abrir o formulario, mesmo que o usuario nao mova os sliders.

---

### Arquivos editados

- `src/pages/MoodDiary.tsx` - trocar `.toFixed(1)` por `Math.round()` (2 locais)
- `src/pages/MoodEntry.tsx` - inicializar emotion_values com defaults na montagem do componente

