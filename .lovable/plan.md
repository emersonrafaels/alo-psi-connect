

## Plano: Aplicar Feature Logo na Página de Encontros

### Problema Identificado

Os componentes de Encontros (Group Sessions) estão usando `tenant?.logo_url` diretamente em vez de `feature_logo_url` com fallback. Além disso, não há suporte para dark mode nesses componentes.

### Componentes Afetados

| Componente | Linha | Uso Atual | Deve Usar |
|------------|-------|-----------|-----------|
| `NextSessionHighlight.tsx` | 48-49 | `tenant?.logo_url` | `feature_logo_url` → `logo_url` |
| `GroupSessionCard.tsx` | 58-59 | `tenant?.logo_url` | `feature_logo_url` → `logo_url` |

### Solução

Aplicar a mesma lógica que foi implementada no `AuthorSpotlight.tsx`:

```typescript
import { useTheme } from "next-themes";

// Dentro do componente:
const { resolvedTheme } = useTheme();

// Função helper para obter feature logo com fallback
const getFeatureLogo = () => {
  const isDarkMode = resolvedTheme === 'dark';
  return isDarkMode 
    ? (tenant?.feature_logo_url_dark || tenant?.logo_url_dark)
    : (tenant?.feature_logo_url || tenant?.logo_url);
};

// Usar no organizerPhoto:
const organizerPhoto = isOrganizedByTenant
  ? getFeatureLogo()
  : session.professional?.foto_perfil_url;
```

---

### Mudanças por Arquivo

#### 1. `src/components/group-sessions/NextSessionHighlight.tsx`

- Adicionar import: `import { useTheme } from "next-themes";`
- Adicionar hook: `const { resolvedTheme } = useTheme();`
- Adicionar função `getFeatureLogo()`
- Alterar linha 48-49 para usar `getFeatureLogo()` quando `isOrganizedByTenant`

#### 2. `src/components/group-sessions/GroupSessionCard.tsx`

- Adicionar import: `import { useTheme } from "next-themes";`
- Adicionar hook: `const { resolvedTheme } = useTheme();`
- Adicionar função `getFeatureLogo()`
- Alterar linha 58-59 para usar `getFeatureLogo()` quando `isOrganizedByTenant`

---

### Comportamento Esperado

```text
Modo Light:
  - Se feature_logo_url configurado → usa feature_logo_url
  - Senão → usa logo_url (fallback)

Modo Dark:
  - Se feature_logo_url_dark configurado → usa feature_logo_url_dark
  - Senão → usa logo_url_dark (fallback)
```

---

### Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/components/group-sessions/NextSessionHighlight.tsx` | +import useTheme, +getFeatureLogo helper, usar no organizerPhoto |
| `src/components/group-sessions/GroupSessionCard.tsx` | +import useTheme, +getFeatureLogo helper, usar no organizerPhoto |

