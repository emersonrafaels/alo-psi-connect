
## Plano: Atualizar Logo e Favicon da Rede Bem Estar

### URLs dos novos arquivos

| Tipo | URL S3 |
|------|--------|
| Logo | `https://alopsi-website.s3.us-east-1.amazonaws.com/rede_bem_estar/logos/logo_redebemestar_1.png` |
| Favicon/Icon | `https://alopsi-website.s3.us-east-1.amazonaws.com/rede_bem_estar/logos/logo_redebemestar_icon_1.png` |

---

### Alterações Necessárias

#### 1. Atualizar banco de dados (tabela `tenants`)

Executar UPDATE no tenant `alopsi` (id: `550e8400-e29b-41d4-a716-446655440000`):

```sql
UPDATE tenants 
SET 
  logo_url = 'https://alopsi-website.s3.us-east-1.amazonaws.com/rede_bem_estar/logos/logo_redebemestar_1.png',
  favicon_url = 'https://alopsi-website.s3.us-east-1.amazonaws.com/rede_bem_estar/logos/logo_redebemestar_icon_1.png'
WHERE slug = 'alopsi';
```

#### 2. Atualizar `index.html`

**Arquivo:** `index.html`

Substituir o favicon atual (linha 31) de:
```html
<link rel="icon" type="image/x-icon" href="https://storage.googleapis.com/gpt-engineer-file-uploads/...">
```

Para:
```html
<link rel="icon" type="image/png" href="https://alopsi-website.s3.us-east-1.amazonaws.com/rede_bem_estar/logos/logo_redebemestar_icon_1.png">
```

---

### Resultado Esperado

| Local | Antes | Depois |
|-------|-------|--------|
| Header do site (TenantBranding) | Logo antigo do S3 | Novo logo `logo_redebemestar_1.png` |
| Aba do navegador (favicon) | Ícone Google Storage | Novo ícone `logo_redebemestar_icon_1.png` |

---

### Observação
O componente `TenantBranding.tsx` já busca `logo_url` do tenant automaticamente, então após atualizar o banco, o novo logo será exibido no header sem necessidade de alteração de código.
