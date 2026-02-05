

## Plano: Usar Cor Roxa no Header do Blog

### Análise da Paleta

A paleta da Rede Bem Estar define:

| Variável | Valor HSL | Cor |
|----------|-----------|-----|
| `--primary` | `280 63% 34%` | Roxo (principal) |
| `--accent` | `330 62% 70%` | Rosa |

### Mudança

| Arquivo | Linha | Antes | Depois |
|---------|-------|-------|--------|
| `src/pages/Blog.tsx` | 83 | `bg-secondary` | `bg-primary` |

### Código

```jsx
// Linha 83 - ANTES
<section className="bg-secondary py-16">

// Linha 83 - DEPOIS  
<section className="bg-primary py-16">
```

### Resultado

O header do blog voltará a usar a cor roxa (`--primary: 280 63% 34%`), respeitando a identidade visual da Rede Bem Estar.

