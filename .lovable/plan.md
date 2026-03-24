

## Corrigir overflow e melhorar UX/UI dos cards de Impacto

### Problema
O texto "320/mês" e "Acompanhamentos" estão transbordando dos cards — os cards são pequenos demais para o conteúdo, especialmente em telas médias.

### Solução

**`src/pages/About.tsx` (linhas 413-428)**

1. **Reduzir tamanho do número**: `text-5xl` → `text-4xl` para caber melhor
2. **Abreviar label longo**: "Acompanhamentos" → "Acompanham." ou manter mas com `text-sm` e `truncate` — melhor: manter o texto completo mas usar `min-w-0` e `break-words`
3. **Aumentar padding horizontal**: `p-8` → `px-4 py-8 sm:px-6` para dar mais respiro
4. **Usar `gap-4`** entre cards em vez de `gap-6` para dar mais espaço a cada card
5. **Tornar responsivo**: em mobile usar `grid-cols-1`, em tablet `grid-cols-3` com tamanhos proporcionais
6. **Adicionar borda sutil** e `shadow-sm` para dar profundidade sem peso
7. **Valor "320/mês"**: separar número e unidade — "320" grande + "/mês" menor ao lado, evitando overflow
8. **Melhorar hierarquia visual**: label em `text-sm font-semibold uppercase tracking-wide` acima do número (inverte a ordem para padrão dashboard)

Layout refinado por card:
```
[Label pequeno uppercase]  ← "ADESÃO"
[Número grande]            ← "87%"
[Descrição]                ← "dos estudantes continuam..."
```

### Arquivo
- `src/pages/About.tsx` — linhas 413-428

