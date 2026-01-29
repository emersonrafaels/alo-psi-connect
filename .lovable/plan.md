

## Plano Expandido: Logos Light/Dark para Todos os Tenants + Switcher Mobile

### Resumo das Mudanças

O sistema já suporta `logo_url` (light) e `logo_url_dark` (dark) por tenant. Este plano expande para:

1. **Melhorar o painel de configuração** - Deixar claro o propósito de cada logo
2. **Adicionar switcher no menu mobile** - Atualmente só existe no desktop
3. **Usar lógica de tema no mobile também**

---

### Situação Atual

| Componente | Logo Light | Logo Dark | Status |
|------------|-----------|-----------|--------|
| Header Desktop (próprio tenant) | ✅ | ✅ | Implementado |
| Header Desktop (switcher) | ✅ | ✅ | Implementado |
| Header Mobile (próprio tenant) | ✅ | ✅ | Implementado |
| Header Mobile (switcher) | ❌ | ❌ | **Não existe** |
| Footer | ✅ | ✅ | Implementado |
| Admin Branding | ✅ | ✅ | Funcional, mas confuso |

---

### Mudança 1: Adicionar Switcher no Menu Mobile

**Arquivo:** `src/components/ui/header.tsx`

**Localização:** Dentro do bloco `{/* Mobile Navigation */}` (linhas 286-412)

**O que adicionar:**
- Botão do switcher similar ao desktop
- Usar a mesma lógica `isDarkMode && otherTenant.logo_url_dark`
- Posicionar após os links de navegação e antes do ThemeToggle

```typescript
// Adicionar no menu mobile, antes do ThemeToggle (linha ~361)
{otherTenant && (() => {
  const mobileSwitcherLogoUrl = isDarkMode && otherTenant.logo_url_dark 
    ? otherTenant.logo_url_dark 
    : otherTenant.logo_url;
  return (
    <button 
      onClick={() => {
        handleTenantNavigation(otherTenant.slug, otherTenant.slug === 'alopsi' ? '/' : `/${otherTenant.slug}`);
        setIsMenuOpen(false);
      }}
      className="flex items-center justify-center bg-background hover:bg-muted rounded-lg px-4 py-3 transition-colors cursor-pointer shadow-md border border-border"
      title={`Ir para ${otherTenant.name}`}
    >
      <img 
        src={mobileSwitcherLogoUrl || '/placeholder.svg'}
        alt={otherTenant.name}
        className="h-8 w-auto object-contain"
      />
    </button>
  );
})()}
```

---

### Mudança 2: Melhorar Painel de Branding

**Arquivo:** `src/components/admin/config/TenantBrandingConfig.tsx`

**Mudanças nos Cards de Logo:**

#### Card 1: Logo Principal (linhas 173-202)

**Antes:**
```
CardTitle: "Logo"
CardDescription: "URL da logo do tenant"
```

**Depois:**
```
CardTitle: "Logo para Fundo Claro (Light Mode)"
CardDescription: "Usado no header, footer e no switcher de outros tenants quando em light mode. Recomendado: logo com texto escuro/colorido."
```

**Adicionar preview do switcher:**
```typescript
{branding.logo_url && (
  <div className="grid grid-cols-2 gap-4">
    {/* Preview normal */}
    <div className="border rounded-lg p-4 bg-white">
      <p className="text-sm text-gray-600 mb-2">No Header:</p>
      <img src={branding.logo_url} alt="Logo light" className="h-12 object-contain" />
    </div>
    {/* Preview no switcher */}
    <div className="border rounded-lg p-4 bg-white">
      <p className="text-sm text-gray-600 mb-2">No Switcher (outro tenant):</p>
      <div className="inline-flex bg-white border rounded-lg px-3 py-2 shadow-sm">
        <img src={branding.logo_url} alt="Switcher preview" className="h-8 object-contain" />
      </div>
    </div>
  </div>
)}
```

#### Card 2: Logo Dark Mode (linhas 204-306)

**Antes:**
```
CardTitle: "Logo para Dark Mode"
CardDescription: "Logo alternativo usado quando o tema escuro está ativo (recomendado: versão clara/branca do logo)"
```

**Depois:**
```
CardTitle: "Logo para Fundo Escuro (Dark Mode)"
CardDescription: "Usado no header, footer e no switcher de outros tenants quando em dark mode. Recomendado: logo com texto branco/claro."
```

**Adicionar preview do switcher com fundo escuro:**
```typescript
{branding.logo_url_dark && (
  <div className="grid grid-cols-2 gap-4">
    {/* Preview normal */}
    <div className="border rounded-lg p-4 bg-gray-900">
      <p className="text-sm text-gray-400 mb-2">No Header:</p>
      <img src={branding.logo_url_dark} alt="Logo dark" className="h-12 object-contain" />
    </div>
    {/* Preview no switcher */}
    <div className="border rounded-lg p-4 bg-gray-900">
      <p className="text-sm text-gray-400 mb-2">No Switcher (outro tenant):</p>
      <div className="inline-flex bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-sm">
        <img src={branding.logo_url_dark} alt="Switcher preview" className="h-8 object-contain" />
      </div>
    </div>
  </div>
)}
```

---

### Fluxo Visual Completo

```text
ESTOU NA MEDCOS (Light Mode)                    ESTOU NA MEDCOS (Dark Mode)
┌─────────────────────────────────────┐        ┌─────────────────────────────────────┐
│ Desktop:                            │        │ Desktop:                            │
│ [Logo MEDCOS light] [RBE btn light] │        │ [Logo MEDCOS dark] [RBE btn dark]   │
├─────────────────────────────────────┤        ├─────────────────────────────────────┤
│ Mobile Menu:                        │        │ Mobile Menu:                        │
│ - Profissionais                     │        │ - Profissionais                     │
│ - Grupos                            │        │ - Grupos                            │
│ - Blog                              │        │ - Blog                              │
│ ┌───────────────────┐               │        │ ┌───────────────────┐               │
│ │ [RBE logo light]  │ ← NOVO        │        │ │ [RBE logo dark]   │ ← NOVO        │
│ └───────────────────┘               │        │ └───────────────────┘               │
│ [Theme Toggle]                      │        │ [Theme Toggle]                      │
└─────────────────────────────────────┘        └─────────────────────────────────────┘

ESTOU NA RBE (Light Mode)                       ESTOU NA RBE (Dark Mode)
┌─────────────────────────────────────┐        ┌─────────────────────────────────────┐
│ Desktop:                            │        │ Desktop:                            │
│ [Logo RBE light] [MEDCOS btn light] │        │ [Logo RBE dark] [MEDCOS btn dark]   │
├─────────────────────────────────────┤        ├─────────────────────────────────────┤
│ Mobile Menu:                        │        │ Mobile Menu:                        │
│ - Profissionais                     │        │ - Profissionais                     │
│ - Grupos                            │        │ - Grupos                            │
│ - Blog                              │        │ - Blog                              │
│ ┌───────────────────┐               │        │ ┌───────────────────┐               │
│ │ [MEDCOS logo lgt] │ ← NOVO        │        │ │ [MEDCOS logo drk] │ ← NOVO        │
│ └───────────────────┘               │        │ └───────────────────┘               │
│ [Theme Toggle]                      │        │ [Theme Toggle]                      │
└─────────────────────────────────────┘        └─────────────────────────────────────┘
```

---

### Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/components/ui/header.tsx` | Adicionar switcher no menu mobile (~15 linhas) |
| `src/components/admin/config/TenantBrandingConfig.tsx` | Melhorar labels, descrições e adicionar previews do switcher (~40 linhas) |

---

### Configuração de Dados Necessária (Após Implementação)

O usuário precisará configurar via Admin → Branding de Tenants:

**Rede Bem Estar (alopsi):**
| Campo | Valor |
|-------|-------|
| `logo_url` | Logo com texto ROXO (para fundos claros) |
| `logo_url_dark` | Logo atual com texto BRANCO (para fundos escuros) |

**MEDCOS:**
| Campo | Valor |
|-------|-------|
| `logo_url` | Logo atual (para fundos claros) |
| `logo_url_dark` | Versão para fundo escuro (se disponível) |

---

### Estimativa

- 2 arquivos
- ~55 linhas alteradas
- Configuração de dados pelo admin

