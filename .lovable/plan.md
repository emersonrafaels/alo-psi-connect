

## Tornar o card do encontro criado clicavel

### Problema

O titulo do encontro na aba "Meus Encontros Criados" e texto puro -- nao e um link clicavel para a pagina de detalhes (`/encontros/:id`). As outras abas ja usam `<Link>` para isso.

### Solucao

**Arquivo: `src/components/group-sessions/MyCreatedSessionsTab.tsx`**

1. Importar `Link` do `react-router-dom` e os helpers de tenant (`getTenantSlugFromPath`, `buildTenantPath`)
2. Envolver o `CardTitle` (linha 138) em um `<Link to={buildTenantPath(tenantSlug, '/encontros/' + session.id)}>` com estilo de hover (underline, cor primaria)
3. Obter o `tenantSlug` a partir do pathname atual

### Detalhes tecnicos

Adicionar imports:
```typescript
import { Link, useLocation } from 'react-router-dom';
import { getTenantSlugFromPath, buildTenantPath } from '@/utils/tenantHelpers';
```

Dentro do componente, obter o slug:
```typescript
const location = useLocation();
const tenantSlug = getTenantSlugFromPath(location.pathname);
```

Alterar o titulo (linha ~138) de:
```tsx
<CardTitle className="text-lg">{session.title}</CardTitle>
```
Para:
```tsx
<Link to={buildTenantPath(tenantSlug, `/encontros/${session.id}`)} className="hover:underline hover:text-primary transition-colors">
  <CardTitle className="text-lg">{session.title}</CardTitle>
</Link>
```

Mudanca pontual, sem impacto em outras funcionalidades.

