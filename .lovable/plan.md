
## Plano: Alterar Cor do Header do Blog para Secondary

### Mudança

| Arquivo | Linha | Antes | Depois |
|---------|-------|-------|--------|
| `src/pages/Blog.tsx` | 83 | `bg-primary` | `bg-secondary` |

### Código

```jsx
// Linha 83 - ANTES
<section className="bg-primary py-16">

// Linha 83 - DEPOIS  
<section className="bg-secondary py-16">
```

### Cores no CSS (src/index.css)

| Variável | Valor (Light) | Descrição |
|----------|---------------|-----------|
| `--primary` | `280 63% 34%` | Roxo |
| `--secondary` | `210 40% 96.1%` | Cinza claro |

### Resultado

O header do blog passará de roxo para um cinza claro suave, alinhando-se com o estilo secundário do design system.
