## Corrigir erro de import do @tiptap/core

Instalar as dependências faltantes que são usadas pelos extensions customizados (`Spacer.ts` e `ImageWithCaption.ts`).

### Ação
```bash
bun add @tiptap/core@^3.7.1 @tiptap/pm@^3.7.1
```

### Resultado esperado
- O erro `Failed to resolve import "@tiptap/core"` desaparece
- Build do Vite volta a funcionar
- Editor de blog continua funcionando normalmente