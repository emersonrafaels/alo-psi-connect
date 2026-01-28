
## Plano: Corrigir Configuração de Profissionais em Destaque Multi-Tenant

### Problemas Identificados

1. **Hook errado no admin**: O componente `FeaturedProfessionalsConfig` usa `useTenant()` (detecta tenant pela URL), mas rotas `/admin/*` não têm prefixo de tenant. Deveria usar `useAdminTenant()` que lê o tenant do seletor do painel admin.

2. **Lista não filtra por tenant**: A query busca todos profissionais ativos da tabela `profissionais` sem filtrar por tenant. Deveria buscar da `professional_tenants` para mostrar apenas profissionais do tenant selecionado.

3. **Preview mostra dados globais**: O preview usa `em_destaque` da tabela `profissionais` (global), não `is_featured` da `professional_tenants` (por tenant).

4. **Homepage sem ordenação correta**: A query da homepage não ordena pelo `featured_order`, então mesmo que os dados estejam corretos, podem aparecer na ordem errada.

---

### Alterações Técnicas

#### 1. Atualizar `FeaturedProfessionalsConfig.tsx`

**Arquivo:** `src/components/admin/config/FeaturedProfessionalsConfig.tsx`

**Mudanças:**

- **Trocar hook**: Substituir `useTenant()` por `useAdminTenant()` para ler o tenant selecionado no admin
- **Alterar query**: Buscar profissionais com join na `professional_tenants` filtrado pelo tenant selecionado
- **Atualizar interface**: Usar campos `is_featured` e `featured_order` do `professional_tenants` no estado local
- **Sincronizar updates**: Manter atualização em ambas tabelas (legacy + tenant-específico)

```typescript
// ANTES
import { useTenant } from '@/hooks/useTenant';
const { tenant } = useTenant();

// DEPOIS  
import { useAdminTenant } from '@/contexts/AdminTenantContext';
const { tenantFilter, tenants } = useAdminTenant();
```

**Nova query para buscar profissionais:**
```typescript
// Buscar profissionais com dados do tenant selecionado
const { data, error } = await supabase
  .from('profissionais')
  .select(`
    id, display_name, profissao, foto_perfil_url, ativo, preco_consulta,
    em_destaque, ordem_destaque,
    professional_tenants!inner(is_featured, featured_order, tenant_id)
  `)
  .eq('ativo', true)
  .eq('professional_tenants.tenant_id', tenantFilter);
```

#### 2. Atualizar query da Homepage (`Index.tsx`)

**Arquivo:** `src/pages/Index.tsx`

**Mudança:** Adicionar ordenação pelo `featured_order` na query

```typescript
// ANTES
.order('display_name')

// DEPOIS
.order('professional_tenants.featured_order')
```

---

### Fluxo Corrigido

```text
┌─────────────────────────────────────────────────────┐
│           Admin Panel (/admin/configuracoes)        │
├─────────────────────────────────────────────────────┤
│  1. Admin seleciona tenant via AdminTenantSelector  │
│  2. FeaturedProfessionalsConfig lê useAdminTenant() │
│  3. Query filtra por professional_tenants.tenant_id │
│  4. Lista mostra profissionais daquele tenant       │
│  5. Toggle atualiza is_featured + em_destaque       │
│  6. Order atualiza featured_order + ordem_destaque  │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│              Homepage (/ ou /medcos)                │
├─────────────────────────────────────────────────────┤
│  1. useTenant() detecta tenant pela URL             │
│  2. Query busca de professional_tenants por tenant  │
│  3. Ordena por featured_order                       │
│  4. Exibe os 3 profissionais em ordem correta       │
└─────────────────────────────────────────────────────┘
```

---

### Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/components/admin/config/FeaturedProfessionalsConfig.tsx` | Trocar hook, alterar query, atualizar lógica de estado |
| `src/pages/Index.tsx` | Adicionar ordenação por `featured_order` |

### Estimativa

- 2 arquivos a modificar
- ~60 linhas de código alteradas
