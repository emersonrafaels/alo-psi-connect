
## Plano: Tornar Logo do Switcher Dinâmico e Configurável

### Problema
O botão de alternância entre tenants no header (ex: botão "MEDCOS" quando você está no Rede Bem Estar) usa URLs de logos **hardcoded** em vez de buscar do banco de dados. Isso significa que:
1. Alterações feitas no painel de branding não afetam esse botão
2. O logo "Alô, Psi!" ainda aparece em vez de "Rede Bem Estar"

### Solução
Modificar o header para buscar dinamicamente o logo do tenant alternativo do banco de dados.

---

### Alterações Técnicas

#### Arquivo: `src/components/ui/header.tsx`

**Mudanças:**

1. **Adicionar estado para tenants**: Buscar todos os tenants ativos ao montar o componente
2. **Substituir URLs hardcoded**: Usar o `logo_url` do tenant alternativo dinamicamente

**Código atual (linhas 116-140):**
```tsx
{tenantSlug === 'alopsi' ? (
  <button onClick={() => handleTenantNavigation('medcos', '/medcos')}>
    <img 
      src="https://alopsi-website.s3.us-east-1.amazonaws.com/imagens/logo/logo_medcos.png" // HARDCODED
      alt="MEDCOS"
    />
  </button>
) : (
  <button onClick={() => handleTenantNavigation('alopsi', '/')}>
    <img 
      src="https://alopsi-website.s3.us-east-1.amazonaws.com/imagens/logo/Logo.png" // HARDCODED - logo antigo!
      alt="Alô, Psi!"
    />
  </button>
)}
```

**Código proposto:**
```tsx
// No início do componente, adicionar:
const [allTenants, setAllTenants] = useState<Tenant[]>([]);

useEffect(() => {
  const fetchTenants = async () => {
    const { data } = await supabase
      .from('tenants')
      .select('id, slug, name, logo_url')
      .eq('is_active', true);
    if (data) setAllTenants(data as Tenant[]);
  };
  fetchTenants();
}, []);

// Na renderização do switcher:
const otherTenant = allTenants.find(t => t.slug !== tenantSlug);

{otherTenant && (
  <button onClick={() => handleTenantNavigation(otherTenant.slug, otherTenant.slug === 'medcos' ? '/medcos' : '/')}>
    <img 
      src={otherTenant.logo_url || '/placeholder-logo.png'}
      alt={otherTenant.name}
    />
  </button>
)}
```

---

### Benefícios

1. **Dinamismo**: Alterações no painel de branding refletem automaticamente no switcher
2. **Escalabilidade**: Se mais tenants forem adicionados, o sistema se adapta
3. **Consistência**: Usa a mesma fonte de dados para todos os logos
4. **Correção imediata**: O logo "Rede Bem Estar" aparecerá corretamente no botão

### Fluxo Visual

```text
┌───────────────────────────────────────────────────┐
│                    HEADER                         │
├───────────────────────────────────────────────────┤
│  [Logo Rede Bem Estar]  ...menu...  [MEDCOS btn]  │
│                                          ↑        │
│                                     Logo vem do   │
│                                     banco (logo_url│
│                                     do medcos)    │
└───────────────────────────────────────────────────┘

Banco de dados:
┌─────────┬─────────────────────────────────────────┐
│ slug    │ logo_url                                │
├─────────┼─────────────────────────────────────────┤
│ alopsi  │ .../logo_redebemestar_2.png             │
│ medcos  │ .../logo_medcos.png                     │
└─────────┴─────────────────────────────────────────┘
```

---

### Arquivo a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/components/ui/header.tsx` | Adicionar fetch de tenants, substituir URLs hardcoded por dados dinâmicos |

### Estimativa
- 1 arquivo
- ~25 linhas de código alteradas
