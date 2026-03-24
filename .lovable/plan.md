

## Scroll to top ao navegar para perfil do profissional

### Problema
Ao clicar em "Ver Perfil" na homepage, a página do profissional abre na posição de scroll anterior.

### Solução
Adicionar `window.scrollTo(0, 0)` em um `useEffect` no `src/pages/Professional.tsx` que executa na montagem do componente (ou quando o `id` muda).

### Alteração
**`src/pages/Professional.tsx` (após linha 53)**
- Adicionar:
```tsx
useEffect(() => {
  window.scrollTo(0, 0);
}, [id]);
```

### Arquivo
- `src/pages/Professional.tsx`

