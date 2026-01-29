
## Plano: Centralizar Todos os Logos no Editor de Tenant

### Resumo do Problema

Atualmente, o sistema possui **múltiplos tipos de logos** usados em diferentes contextos, mas nem todos estão acessíveis no modal de edição de tenant (`TenantEditorModal`). Alguns logos podem ser editados apenas via `TenantBrandingConfig`, criando inconsistência.

### Logos Identificados no Sistema

| Logo | Usado em | Configurável no Editor? | Light/Dark |
|------|----------|------------------------|------------|
| `logo_url` | Header, Footer, Switcher | ✅ Parcial (só no Básico) | Light |
| `logo_url_dark` | Header, Footer, Switcher (dark mode) | ❌ Não | Dark |
| `favicon_url` | Aba do navegador | ✅ Tab Favicon | Único |
| `social_share_image` | Open Graph (compartilhamento) | ✅ Tab SEO | Único |
| `fallback_professional_image` | Imagem padrão de profissionais | ❌ Não | Único |

### Estado Atual do Banco de Dados

```
Rede Bem Estar (alopsi):
- logo_url: ✅ configurado (logo branco)
- logo_url_dark: ❌ NULL
- favicon_url: ✅ configurado

Medcos:
- logo_url: ✅ configurado
- logo_url_dark: ❌ NULL
- favicon_url: ✅ configurado
```

### Solução Proposta

#### 1. Adicionar Tab "Logos" no TenantEditorModal

Criar uma nova aba dedicada chamada **"Logos"** que centralize todos os logos com previews para Light e Dark mode:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  Tab: Logos                                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ LOGO PRINCIPAL (LIGHT MODE)                                      │   │
│  │ Usado no header, footer e no switcher quando em modo claro.      │   │
│  │                                                                   │   │
│  │ URL: [________________________] [Upload]                          │   │
│  │                                                                   │   │
│  │ Preview (fundo claro):     Preview no Switcher:                   │   │
│  │ ┌────────────┐             ┌──────────────┐                       │   │
│  │ │ [Logo]     │             │ bg-white     │                       │   │
│  │ │ bg-white   │             │   [Logo]     │                       │   │
│  │ └────────────┘             └──────────────┘                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ LOGO PARA DARK MODE                                              │   │
│  │ Usado no header, footer e no switcher quando em modo escuro.     │   │
│  │                                                                   │   │
│  │ URL: [________________________] [Upload]                          │   │
│  │                                                                   │   │
│  │ Preview (fundo escuro):    Preview no Switcher:                   │   │
│  │ ┌────────────┐             ┌──────────────┐                       │   │
│  │ │ [Logo]     │             │ bg-gray-800  │                       │   │
│  │ │ bg-gray-900│             │   [Logo]     │                       │   │
│  │ └────────────┘             └──────────────┘                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ IMAGEM PADRÃO DE PROFISSIONAL                                    │   │
│  │ Usada quando profissionais não têm foto de perfil.               │   │
│  │                                                                   │   │
│  │ URL: [________________________] [Upload]                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 2. Mudanças no Código

**Arquivo: `src/components/admin/TenantEditorModal.tsx`**

1. **Adicionar campos ao estado `formData`:**
```typescript
// Adicionar no useState
logo_url_dark: "",
fallback_professional_image: "",
```

2. **Adicionar ao useEffect (carregar dados do tenant):**
```typescript
logo_url_dark: tenant.logo_url_dark || "",
fallback_professional_image: tenant.fallback_professional_image || "",
```

3. **Adicionar ao objeto `tenantData` no handleSubmit:**
```typescript
logo_url_dark: formData.logo_url_dark || null,
fallback_professional_image: formData.fallback_professional_image || null,
```

4. **Adicionar nova Tab "Logos" na TabsList:**
```typescript
<TabsTrigger value="logos">Logos</TabsTrigger>
```

5. **Criar conteúdo da Tab Logos:**
   - Campo para `logo_url` (Light Mode) com preview em fundo claro e preview do switcher
   - Campo para `logo_url_dark` (Dark Mode) com preview em fundo escuro e preview do switcher
   - Campo para `fallback_professional_image` com preview
   - Upload via edge function `upload-to-s3` para cada campo

6. **Mover campo `logo_url` da tab "Básico" para tab "Logos"**

**Arquivo: Interface local do modal:**

Adicionar campos faltantes à interface `Tenant`:
```typescript
logo_url_dark?: string | null;
fallback_professional_image?: string | null;
```

### Estrutura da Nova Tab

```typescript
<TabsContent value="logos" className="space-y-6">
  {/* Logo Light Mode */}
  <Card className="p-4 space-y-4">
    <div>
      <h3 className="font-medium">Logo para Fundo Claro (Light Mode)</h3>
      <p className="text-sm text-muted-foreground">
        Usado no header, footer e no switcher quando em modo claro.
        Recomendado: logo com texto escuro/colorido.
      </p>
    </div>
    
    <div className="flex gap-2">
      <Input
        value={formData.logo_url}
        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
        placeholder="https://exemplo.com/logo-light.png"
      />
      <Input type="file" onChange={handleLogoLightUpload} />
    </div>
    
    {formData.logo_url && (
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-sm text-gray-600 mb-2">No Header:</p>
          <img src={formData.logo_url} className="h-12 object-contain" />
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-sm text-gray-600 mb-2">No Switcher:</p>
          <div className="inline-flex bg-white border rounded-lg px-3 py-2 shadow-sm">
            <img src={formData.logo_url} className="h-8 object-contain" />
          </div>
        </div>
      </div>
    )}
  </Card>
  
  {/* Logo Dark Mode */}
  <Card className="p-4 space-y-4">
    <div>
      <h3 className="font-medium">Logo para Fundo Escuro (Dark Mode)</h3>
      <p className="text-sm text-muted-foreground">
        Usado no header, footer e no switcher quando em modo escuro.
        Recomendado: logo com texto branco/claro.
      </p>
    </div>
    
    <div className="flex gap-2">
      <Input
        value={formData.logo_url_dark}
        onChange={(e) => setFormData({ ...formData, logo_url_dark: e.target.value })}
        placeholder="https://exemplo.com/logo-dark.png"
      />
      <Input type="file" onChange={handleLogoDarkUpload} />
    </div>
    
    {formData.logo_url_dark && (
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-gray-900">
          <p className="text-sm text-gray-400 mb-2">No Header:</p>
          <img src={formData.logo_url_dark} className="h-12 object-contain" />
        </div>
        <div className="border rounded-lg p-4 bg-gray-900">
          <p className="text-sm text-gray-400 mb-2">No Switcher:</p>
          <div className="inline-flex bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
            <img src={formData.logo_url_dark} className="h-8 object-contain" />
          </div>
        </div>
      </div>
    )}
  </Card>
  
  {/* Fallback Professional Image */}
  <Card className="p-4 space-y-4">
    <div>
      <h3 className="font-medium">Imagem Padrão de Profissional</h3>
      <p className="text-sm text-muted-foreground">
        Exibida quando um profissional não possui foto de perfil.
      </p>
    </div>
    
    <div className="flex gap-2">
      <Input
        value={formData.fallback_professional_image}
        onChange={(e) => setFormData({ ...formData, fallback_professional_image: e.target.value })}
        placeholder="https://exemplo.com/avatar-default.png"
      />
      <Input type="file" onChange={handleFallbackImageUpload} />
    </div>
    
    {formData.fallback_professional_image && (
      <div className="flex justify-center">
        <img src={formData.fallback_professional_image} className="w-24 h-24 rounded-full object-cover" />
      </div>
    )}
  </Card>
</TabsContent>
```

### Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/components/admin/TenantEditorModal.tsx` | Adicionar tab "Logos", campos `logo_url_dark` e `fallback_professional_image` no estado e submit, funções de upload, mover logo_url da tab básico |

### Resumo Visual Final

Após implementação, a Tab "Logos" terá:

```text
┌────────────────────────────────────────────────────────────────┐
│ Abas: Básico | Tema | Logos | Branding | Favicon | ...         │
│                        ↑                                        │
│                     NOVA TAB                                    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📦 Logo Light Mode (para fundos claros)                        │
│     - URL + Upload                                              │
│     - Preview Header + Preview Switcher                         │
│                                                                 │
│  🌙 Logo Dark Mode (para fundos escuros)                        │
│     - URL + Upload                                              │
│     - Preview Header + Preview Switcher                         │
│                                                                 │
│  👤 Imagem Padrão de Profissional                               │
│     - URL + Upload                                              │
│     - Preview circular                                          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Estimativa

- 1 arquivo principal modificado
- ~150 linhas adicionadas
- 3 campos novos no formulário
- Funções de upload reutilizadas do padrão existente
