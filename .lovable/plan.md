

## Plano: Adicionar Logos Específicos para Footer e Features

### Objetivo

Adicionar novas opções de logos configuráveis por tenant:

1. **Logo do Footer** (light e dark) - Atualmente o footer usa o mesmo logo do header
2. **Logo de Features/Ícones** (light e dark) - Para uso em páginas como Blog, Encontros, etc.

Todos com fallback automático para o logo principal do header caso não sejam configurados.

---

### Novos Campos no Banco de Dados

| Campo | Descrição | Fallback |
|-------|-----------|----------|
| `footer_logo_url` | Logo do footer (light mode) | → `logo_url` |
| `footer_logo_url_dark` | Logo do footer (dark mode) | → `logo_url_dark` |
| `feature_logo_url` | Logo para features (light mode) | → `logo_url` |
| `feature_logo_url_dark` | Logo para features (dark mode) | → `logo_url_dark` |

---

### Arquitetura Visual

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Tab: Logos                                                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│ ┌─ LOGOS DESTE TENANT ──────────────────────────────────────────────────────┐   │
│ │ 🌞 Logo Light Mode (Header)    🌙 Logo Dark Mode (Header)                 │   │
│ └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│ ┌─ LOGOS NO SWITCHER DE OUTROS TENANTS ────────────────────────────────────┐   │
│ │ 🌞 Switcher Light   🌙 Switcher Dark                                      │   │
│ └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│ ┌─ LOGO DO FOOTER (NOVO) ──────────────────────────────────────────────────┐   │
│ │ 🌞 Footer Light Mode          🌙 Footer Dark Mode                         │   │
│ │    Se vazio, usa logo do header   Se vazio, usa logo do header            │   │
│ │                                                                            │   │
│ │    Preview:                       Preview:                                 │   │
│ │    ┌────────────────────┐        ┌────────────────────┐                   │   │
│ │    │ bg similar footer │        │ bg similar footer  │                   │   │
│ │    │   [Footer Logo]    │        │   [Footer Logo]    │                   │   │
│ │    └────────────────────┘        └────────────────────┘                   │   │
│ └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│ ┌─ LOGO DE FEATURES/ÍCONES (NOVO) ─────────────────────────────────────────┐   │
│ │ 🌞 Feature Light Mode         🌙 Feature Dark Mode                        │   │
│ │    Se vazio, usa logo do header   Se vazio, usa logo do header            │   │
│ │                                                                            │   │
│ │    Usado em: Blog, Encontros, Autores, etc.                                │   │
│ │                                                                            │   │
│ │    Preview:                       Preview:                                 │   │
│ │    ┌────────────────────┐        ┌────────────────────┐                   │   │
│ │    │   [Feature Icon]   │        │   [Feature Icon]   │                   │   │
│ │    │   w-16 h-16        │        │   w-16 h-16        │                   │   │
│ │    └────────────────────┘        └────────────────────┘                   │   │
│ └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│ ┌─ IMAGEM PADRÃO DE PROFISSIONAL ──────────────────────────────────────────┐   │
│ │ 👤 Fallback para profissionais sem foto                                    │   │
│ └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### Mudanças por Arquivo

#### 1. Database Migration (SQL)

Adicionar 4 novas colunas na tabela `tenants`:

```sql
ALTER TABLE tenants 
ADD COLUMN footer_logo_url text,
ADD COLUMN footer_logo_url_dark text,
ADD COLUMN feature_logo_url text,
ADD COLUMN feature_logo_url_dark text;
```

#### 2. `src/types/tenant.ts`

Adicionar na interface `Tenant`:

```typescript
// Footer logos - separate from header
footer_logo_url?: string | null;
footer_logo_url_dark?: string | null;

// Feature/icons logos - used on blog, group sessions, etc.
feature_logo_url?: string | null;
feature_logo_url_dark?: string | null;
```

#### 3. `src/components/admin/TenantEditorModal.tsx`

**Estado (`formData`):**
```typescript
footer_logo_url: "",
footer_logo_url_dark: "",
feature_logo_url: "",
feature_logo_url_dark: "",
```

**useEffect (carregar dados):**
```typescript
footer_logo_url: tenant.footer_logo_url || "",
footer_logo_url_dark: tenant.footer_logo_url_dark || "",
feature_logo_url: tenant.feature_logo_url || "",
feature_logo_url_dark: tenant.feature_logo_url_dark || "",
```

**handleSubmit:**
```typescript
footer_logo_url: formData.footer_logo_url || null,
footer_logo_url_dark: formData.footer_logo_url_dark || null,
feature_logo_url: formData.feature_logo_url || null,
feature_logo_url_dark: formData.feature_logo_url_dark || null,
```

**handleLogoUpload - Adicionar tipos:**
```typescript
type: 'light' | 'dark' | 'switcher-light' | 'switcher-dark' | 'footer-light' | 'footer-dark' | 'feature-light' | 'feature-dark' | 'fallback'
```

**Nova seção na Tab Logos:**
- Seção "Logo do Footer" com campos light/dark e previews
- Seção "Logo de Features" com campos light/dark e previews
- Explicação sobre fallback para logo principal

#### 4. `src/components/ui/footer.tsx`

Atualizar para usar os novos campos com fallback:

```typescript
// Antes:
const footerLogoUrl = isDarkMode && tenant?.logo_url_dark 
  ? tenant.logo_url_dark 
  : tenant?.logo_url;

// Depois:
const footerLogoUrl = isDarkMode 
  ? (tenant?.footer_logo_url_dark || tenant?.logo_url_dark)
  : (tenant?.footer_logo_url || tenant?.logo_url);
```

#### 5. `src/components/blog/AuthorSpotlight.tsx` (exemplo de feature)

Atualizar para usar feature logo quando for sistema/admin:

```typescript
// Obter logo de feature com fallback
const getFeatureLogo = () => {
  const isDarkMode = resolvedTheme === 'dark';
  return isDarkMode 
    ? (tenant?.feature_logo_url_dark || tenant?.logo_url_dark)
    : (tenant?.feature_logo_url || tenant?.logo_url);
};

// Usar em autores do sistema
const displayPhoto = isSystemAdmin ? getFeatureLogo() : author.author_photo;
```

---

### Lógica de Fallback

```text
Footer Light:  footer_logo_url → logo_url
Footer Dark:   footer_logo_url_dark → logo_url_dark

Feature Light: feature_logo_url → logo_url
Feature Dark:  feature_logo_url_dark → logo_url_dark
```

Isso significa que se o admin não configurar logos específicos para footer ou features, o sistema automaticamente usa o logo principal do header.

---

### Arquivos a Modificar

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `supabase/migrations/...` | Migration | Adicionar 4 colunas |
| `src/integrations/supabase/types.ts` | Auto-gerado | Atualizado após migration |
| `src/types/tenant.ts` | Interface | Adicionar 4 campos |
| `src/components/admin/TenantEditorModal.tsx` | Admin UI | Adicionar seções de logo |
| `src/components/ui/footer.tsx` | Component | Usar footer_logo_url com fallback |
| `src/components/blog/AuthorSpotlight.tsx` | Component | Usar feature_logo_url |

---

### Estimativa

- 1 migration SQL
- ~6 arquivos modificados
- ~120 linhas adicionadas
- Lógica de fallback automática mantém compatibilidade

