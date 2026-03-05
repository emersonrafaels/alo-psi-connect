

## Melhorar indicação visual de que o seletor de emoção é clicável

O SelectTrigger atual está "invisível" — sem borda, sem fundo, sem indicador visual de interatividade. Vou adicionar estilos sutis que deixem claro que é clicável.

### Alteração em `src/pages/MoodDiary.tsx` (linha 229)

Atualizar o `SelectTrigger` para incluir:
- Fundo leve (`bg-muted/50`) com hover (`hover:bg-muted`)
- Padding e border-radius para parecer um botão/chip
- Ícone ChevronDown mais visível
- Transição suave

De:
```tsx
<SelectTrigger className="h-auto border-none p-0 text-sm font-medium shadow-none focus:ring-0 [&>svg]:h-3 [&>svg]:w-3">
```

Para:
```tsx
<SelectTrigger className="h-auto border border-border/50 rounded-md px-2 py-1 text-sm font-medium shadow-none hover:bg-muted/80 transition-colors focus:ring-1 focus:ring-primary/30 [&>svg]:h-3 [&>svg]:w-3">
```

Uma única linha de mudança — apenas estilização CSS no componente existente.

