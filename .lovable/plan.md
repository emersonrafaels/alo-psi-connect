

## Plano: Configurar Logo Dark Mode da Rede Bem Estar e Ajustar Switcher

### Problema Identificado

O logo atual da Rede Bem Estar (`logo_redebemestar_2.png`) usa texto **branco**, tornando-o invisível quando exibido no botão switcher com fundo claro (modo light).

**Estado atual no banco de dados:**

| Tenant | logo_url | logo_url_dark |
|--------|----------|---------------|
| alopsi (Rede Bem Estar) | `.../logo_redebemestar_2.png` | NULL |
| medcos | `.../logo_medcos.png` | NULL |

**Problema no código:**
O switcher no header (linha 139) usa apenas `otherTenant.logo_url`, ignorando o tema atual e o campo `logo_url_dark`.

---

### Solução Proposta

#### Parte 1: Configurar Logo Correto no Banco de Dados

Precisamos de duas versões do logo Rede Bem Estar:
- **Logo para fundo claro** (texto escuro/colorido) → `logo_url`
- **Logo para fundo escuro** (texto branco) → `logo_url_dark`

**Opção recomendada:** O logo branco atual deve ir para `logo_url_dark`, e um logo com texto roxo/escuro deve ser o `logo_url` principal.

Se existir uma versão com texto escuro no S3 (ex: `logo_redebemestar_3.png` ou similar), podemos usá-la. Caso contrário, será necessário fazer upload de uma nova versão.

#### Parte 2: Atualizar o Switcher para Usar o Tema

**Arquivo:** `src/components/ui/header.tsx`

**Mudanças necessárias:**

1. **Importar hook de tema:**
```typescript
import { useTheme } from 'next-themes';
```

2. **Adicionar campo `logo_url_dark` na query do fetch:**
```typescript
// Linha 47 - adicionar logo_url_dark
.select('id, slug, name, logo_url, logo_url_dark, cross_tenant_navigation_warning_enabled, ...')
```

3. **Usar o tema para escolher o logo correto:**
```typescript
const { resolvedTheme } = useTheme();
const isDarkMode = resolvedTheme === 'dark';

// Na renderização do switcher (linha 139):
const switcherLogoUrl = isDarkMode && otherTenant.logo_url_dark 
  ? otherTenant.logo_url_dark 
  : otherTenant.logo_url;
```

4. **Atualizar a imagem do switcher:**
```typescript
<img 
  src={switcherLogoUrl || '/placeholder.svg'}
  alt={otherTenant.name}
  className="h-8 w-auto object-contain"
/>
```

---

### Fluxo Visual

```text
MODO LIGHT (fundo branco)                MODO DARK (fundo escuro)
┌─────────────────────────┐             ┌─────────────────────────┐
│  Header MEDCOS          │             │  Header MEDCOS          │
│                         │             │                         │
│  [Rede Bem Estar btn]   │             │  [Rede Bem Estar btn]   │
│   Logo texto ROXO ✓     │             │   Logo texto BRANCO ✓   │
│   (logo_url)            │             │   (logo_url_dark)       │
└─────────────────────────┘             └─────────────────────────┘

No banco:
┌─────────┬──────────────────────────────┬──────────────────────────────┐
│ slug    │ logo_url (para fundo claro)  │ logo_url_dark (fundo escuro) │
├─────────┼──────────────────────────────┼──────────────────────────────┤
│ alopsi  │ .../logo_texto_roxo.png      │ .../logo_texto_branco.png    │
│ medcos  │ .../logo_medcos.png          │ (opcional)                   │
└─────────┴──────────────────────────────┴──────────────────────────────┘
```

---

### Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/components/ui/header.tsx` | Importar `useTheme`, adicionar `logo_url_dark` na query, implementar lógica de seleção de logo baseada no tema |

### Configuração de Dados Necessária

Após implementar o código, será necessário:

1. **Fazer upload** de uma versão do logo Rede Bem Estar com texto roxo/escuro (para fundos claros)
2. **Atualizar o banco** via Admin → Branding de Tenants:
   - `logo_url`: versão com texto escuro
   - `logo_url_dark`: versão atual (texto branco)

---

### Considerações Adicionais

- O mesmo padrão pode ser aplicado ao tenant MEDCOS futuramente se necessário
- A lógica é consistente com a já implementada no `TenantBranding.tsx` e `footer.tsx`

### Estimativa

- 1 arquivo de código
- ~10 linhas alteradas
- 1 configuração de dados no admin

