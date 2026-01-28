

## Plano: Aplicar Nova Identidade Visual - Rede Bem Estar

### Paleta de Cores Extraída do Brand Guide

| Cor | HEX | HSL | Uso |
|-----|-----|-----|-----|
| **Roxo** | `#5b218e` | 273° 63% 34% | Cor primária |
| **Rosa** | `#e281bb` | 330° 60% 70% | Cor de destaque (accent) |
| **Ciano/Turquesa** | `#97d3d9` | 186° 44% 72% | Cor secundária |
| **Cinza Claro** | `#f4f4f4` | 0° 0% 96% | Background |

### Tipografia do Brand

| Tipo | Fonte |
|------|-------|
| **Títulos (headings)** | Carbona |
| **Corpo (body)** | Inter |

> **Nota:** Inter já é a fonte padrão do sistema. Carbona precisaria ser adicionada via Google Fonts ou como fonte customizada, mas como não está disponível gratuitamente, podemos usar uma alternativa similar.

---

### Alterações Necessárias

#### 1. Atualizar banco de dados (tabela `tenants`)

Executar UPDATE no tenant `alopsi` com todas as novas cores:

```sql
UPDATE tenants 
SET 
  -- Cores principais do brand
  primary_color = '#5b218e',           -- Roxo
  accent_color = '#e281bb',            -- Rosa
  header_color = '#5b218e',            -- Header em roxo
  
  -- Cores de texto do header
  header_text_color_light = '#FFFFFF',
  header_text_color_dark = '#FFFFFF',
  
  -- Cores dos botões
  button_bg_color_light = '#e281bb',   -- Rosa para CTAs
  button_text_color_light = '#5b218e', -- Texto roxo escuro
  button_bg_color_dark = '#e281bb',
  button_text_color_dark = '#5b218e',
  
  -- Cores das tags de especialidade
  specialty_tag_bg_light = '#f4f4f4',
  specialty_tag_text_light = '#5b218e',
  specialty_tag_bg_dark = '#5b218e',
  specialty_tag_text_dark = '#e281bb',
  
  -- Cores do footer
  footer_bg_color_light = '#5b218e',
  footer_text_color_light = '#FFFFFF',
  footer_bg_color_dark = '#5b218e',
  footer_text_color_dark = '#FFFFFF',
  
  -- Theme config com secondary
  theme_config = jsonb_set(
    COALESCE(theme_config, '{}'::jsonb),
    '{secondary_color}',
    '"#97d3d9"'
  )
WHERE slug = 'alopsi';
```

#### 2. Verificar cache do tenant

Após atualizar o banco, limpar o cache local para forçar o recarregamento das novas cores:
- O sistema já possui lógica de cache-busting
- O usuário deve fazer hard refresh (Ctrl+Shift+R) ou o sistema irá detectar automaticamente

---

### Resultado Visual Esperado

| Elemento | Antes | Depois |
|----------|-------|--------|
| **Header** | Azul escuro | Roxo `#5b218e` |
| **Botões primários** | Azul/Cyan | Rosa `#e281bb` com texto roxo |
| **Elementos de destaque** | Cyan | Rosa `#e281bb` |
| **Tags de especialidades** | Azul claro | Roxo/Rosa |
| **Footer** | Azul | Roxo `#5b218e` |

---

### Impacto nos Tenants

| Tenant | Será Afetado? |
|--------|---------------|
| **Rede Bem Estar** (alopsi) | ✅ Sim - Nova paleta de cores |
| **MEDCOS** (medcos) | ❌ Não - Mantém cores atuais |

---

### Detalhes Técnicos

O sistema multi-tenant já está preparado para aplicar cores dinamicamente:

1. **TenantContext.tsx** - Busca cores do banco e aplica via CSS variables
2. **colorHelpers.ts** - Converte HEX para HSL automaticamente
3. **index.css** - Define variáveis CSS que usam valores do tenant

A função `applyTenantTheme()` já suporta todos os campos de cor:
- `primary_color` → `--primary`
- `accent_color` → `--accent`
- `header_color` → `--header-bg`
- `theme_config.secondary_color` → `--secondary`
- E todas as variantes para light/dark mode

---

### Próximos Passos (Opcional)

1. **Fonte Carbona**: Se necessário, podemos adicionar uma fonte similar (como Poppins ou Montserrat) para títulos
2. **Hero Images**: Atualizar imagens do hero carousel com as novas cores/estilo do brand
3. **Pattern do Brand**: O PDF mostra um padrão visual que pode ser usado como background decorativo

