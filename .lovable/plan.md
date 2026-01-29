

## Plano: Botão Flutuante "Voltar ao Topo"

### Objetivo

Adicionar um botão flutuante no lado direito da tela que aparece quando o usuário rola a página, permitindo voltar ao topo com um clique.

### Análise do Layout Atual

| Componente | Posição | Z-Index |
|------------|---------|---------|
| `WhatsAppFloat` | `bottom-6 right-6` | z-50 |
| Novo botão | `bottom-24 right-6` (acima do WhatsApp) | z-40 |

### Solução

Criar um novo componente `ScrollToTopButton` seguindo o padrão existente do `FloatingBackButton`:

```text
+-------------------------------------------+
|                                           |
|                                           |
|                                    [↑]    | ← Scroll to Top (bottom-24)
|                                    [💬]   | ← WhatsApp (bottom-6)
+-------------------------------------------+
```

### Comportamento

| Condição | Estado do Botão |
|----------|-----------------|
| Scroll < 400px | Invisível (fade out) |
| Scroll >= 400px | Visível (fade in) |
| Clique | Scroll suave para o topo |

### Novo Arquivo

**`src/components/ui/scroll-to-top-button.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      variant="secondary"
      className={cn(
        "fixed bottom-24 right-6 z-40 shadow-lg transition-all duration-300",
        "hover:scale-110 hover:shadow-xl",
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
      aria-label="Voltar ao topo"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
};

export default ScrollToTopButton;
```

### Integração Global

**Modificar `src/App.tsx`** para adicionar o componente globalmente, junto com o `WhatsAppFloat`:

```tsx
import ScrollToTopButton from "@/components/ui/scroll-to-top-button";

// ... no retorno do App
<WhatsAppFloat />
<ScrollToTopButton />
```

### Resumo das Alterações

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/ui/scroll-to-top-button.tsx` | Criar | Novo componente de botão flutuante |
| `src/App.tsx` | Modificar | Importar e adicionar o componente globalmente |

### Características Visuais

- Ícone `ArrowUp` do Lucide
- Estilo `variant="secondary"` para combinar com o design
- Animação de fade in/out com translate suave
- Efeito hover com scale e sombra
- Posicionado acima do botão WhatsApp para não sobrepor

