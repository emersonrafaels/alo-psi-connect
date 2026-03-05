

## Duas alterações

### 1. Template padrão: basic → advanced

**Arquivo:** `src/hooks/useEmotionConfig.tsx`

Na função `initializeDefaultConfigs` (linha 115), trocar o filtro de `type.category === 'basic'` para incluir as emoções do template avançado. Como os `defaultTypes` vêm do banco com categorias variadas, a forma mais segura é filtrar pelos emotion_types do template advanced diretamente:

```typescript
const advancedEmotions = ['mood', 'anxiety', 'energy', 'stress', 'motivation', 'focus'];
const emotionsForInit = defaultTypes.filter(type => advancedEmotions.includes(type.emotion_type));
```

### 2. Corrigir emoji do Foco

**Arquivo:** `src/utils/emotionFormatters.ts`

O emoji do `focus` no `getDefaultEmoji` já está como 🎯 (correto). O problema é que o emoji vem do banco de dados (`default_emotion_types.default_emoji_set`), e quando o template é aplicado, ele copia esse emoji_set do banco para `emotion_configurations`.

Para corrigir para usuários existentes e futuros, preciso:

1. Atualizar o `default_emotion_types` no banco via SQL — alterar o `default_emoji_set` do `focus` para usar 🎯 em vez de 😵
2. Atualizar os `emotion_configurations` existentes que tenham `focus` com emoji errado

**Execução via Supabase:**
```sql
UPDATE default_emotion_types 
SET default_emoji_set = jsonb_set(default_emoji_set, '{3}', '"🎯"')
WHERE emotion_type = 'focus';
```

Porém, como não tenho certeza da estrutura exata do JSON no banco, vou adicionar uma correção no código: na `initializeDefaultConfigs` e no `applyTemplate`, sobrescrever o emoji_set do `focus` com valores corretos baseados no `getDefaultEmoji` do `emotionFormatters.ts`.

**Abordagem mais pragmática:** Adicionar um mapeamento de correção de emojis no `useEmotionConfig.tsx` que é aplicado ao criar configs, garantindo que `focus` use 🎯 independente do que venha do banco.

### Resumo de arquivos
- `src/hooks/useEmotionConfig.tsx` — mudar default de basic para advanced + fix emoji do focus na criação

