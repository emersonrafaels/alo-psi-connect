
## Plano: Corrigir Cor do Header/Breadcrumb no Blog + Limpeza de Cache

### Problema Identificado

A página `/blog` contém uma cor **azul hard-coded** que não respeita a paleta de cores do tenant:

```jsx
// src/pages/Blog.tsx - Linha 83
<section className="bg-[#5e95e8] py-16">
```

A cor `#5e95e8` (azul) deveria ser a cor **primária do tenant** (Roxo para Rede Bem Estar).

### Solução

| Arquivo | Linha | Mudança |
|---------|-------|---------|
| `src/pages/Blog.tsx` | 83 | Substituir `bg-[#5e95e8]` por `bg-primary` |
| `src/utils/cacheHelpers.ts` | - | Adicionar limpeza de cache CSS/Tenant |

### Mudança 1: Corrigir Cor do Header

**Antes:**
```jsx
<section className="bg-[#5e95e8] py-16">
```

**Depois:**
```jsx
<section className="bg-primary py-16">
```

Isso fará com que a seção use a variável CSS `--primary` que já está configurada como roxo (`280 63% 34%`) para a Rede Bem Estar.

### Mudança 2: Adicionar Função de Limpeza de Cache CSS

Adicionar no `cacheHelpers.ts` uma função para forçar a limpeza de cache de estilos:

```typescript
export const clearCSSCache = () => {
  // Força re-fetch dos estilos
  const links = document.querySelectorAll('link[rel="stylesheet"]');
  links.forEach((link) => {
    const href = (link as HTMLLinkElement).href;
    if (href) {
      (link as HTMLLinkElement).href = href.split('?')[0] + '?v=' + Date.now();
    }
  });
  
  console.log('✅ Cache de CSS invalidado');
};
```

### Paleta Atual (Rede Bem Estar)

| Variável | Valor HSL | Cor |
|----------|-----------|-----|
| `--primary` | `280 63% 34%` | Roxo |
| `--accent` | `330 62% 70%` | Rosa |

### Resultado Esperado

**Antes:** Header azul (#5e95e8)
**Depois:** Header roxo (cor primária do tenant)

### Nota sobre Cache

Os estilos CSS já estão corretos no `src/index.css`. Se o usuário ainda vir cores antigas, é cache do navegador. A função de limpeza de cache ajudará, mas um **hard refresh** (Ctrl+Shift+R) também resolve.
