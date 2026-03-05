

## Dois problemas para resolver

### 1. Emoji do Foco não atualizado para usuários existentes

O `EMOJI_CORRECTIONS` só é aplicado na criação de configs (initializeDefaultConfigs/applyTemplate). Para usuários que já têm configs salvas, os emojis antigos persistem no banco.

**Solução:** Aplicar `applyEmojiCorrections` no `fetchUserConfigs`, corrigindo os emojis ao carregar os dados. Assim, mesmo configs existentes no banco terão os emojis corrigidos em memória. Além disso, criar uma migration SQL para atualizar os registros existentes no banco.

**Arquivo: `src/hooks/useEmotionConfig.tsx`** (linha 100)
```typescript
const configs = (data || []).map((config: any) => ({
  ...config,
  emoji_set: applyEmojiCorrections(config.emotion_type, config.emoji_set),
})) as EmotionConfig[];
```

**Nova migration SQL:**
```sql
UPDATE emotion_configurations 
SET emoji_set = jsonb_set(
  jsonb_set(
    jsonb_set(emoji_set, '{1}', '"😶"'),
    '{2}', '"🤔"'
  ),
  '{3}', '"🎯"'
)
WHERE emotion_type = 'focus';
```

### 2. Melhorar UX/UI do seletor no card de estatísticas

O seletor atual com borda e chevron parece um form input genérico, não combina com o visual dos outros cards.

**Solução:** Trocar para um design de "chip/tag" mais elegante — texto com ícone de chevron sutil inline, sem borda de input. Usar fundo levemente colorido com hover state para parecer clicável sem parecer formulário.

**Arquivo: `src/pages/MoodDiary.tsx`** (linhas 225-251)

Redesign do card:
- `CardTitle` com o nome da emoção selecionada como texto principal + "(7 dias)" como subtítulo
- `Select` integrado de forma mais orgânica: trigger com estilo de chip/pill (fundo primary/10, rounded-full, padding horizontal)
- Remover ícone Heart fixo, usar emoji da emoção selecionada no lugar
- Manter o dropdown funcional

```tsx
<Card className="border-primary/20">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <div className="flex-1 min-w-0">
      <Select value={selectedStatEmotion} onValueChange={setSelectedStatEmotion}>
        <SelectTrigger className="h-auto w-auto inline-flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full px-3 py-1 text-sm font-medium border-none shadow-none transition-colors focus:ring-1 focus:ring-primary/30 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-primary/60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {activeConfigs.map(config => (
            <SelectItem key={config.emotion_type} value={config.emotion_type}>
              {config.display_name} (7 dias)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <Heart className="h-4 w-4 text-primary flex-shrink-0" />
  </CardHeader>
  ...
</Card>
```

### Resumo de arquivos
- `src/hooks/useEmotionConfig.tsx` — aplicar correções de emoji ao carregar configs
- `src/pages/MoodDiary.tsx` — redesign do seletor para chip/pill style
- Nova migration SQL — corrigir emojis de focus no banco

