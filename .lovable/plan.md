

## Plano: Adicionar Link "Minha Instituição" no Menu Mobile

### Problema Identificado

O usuário `xamahot633@1200b.com` possui:
- Role `institution_admin` na tabela `user_roles` ✓
- Vínculo ativo na tabela `institution_users` com UNICAMP ✓
- A função `has_role('institution_admin')` retorna `true` ✓

**Porém o menu mobile não contém o link para o Portal Institucional!**

| Menu | Link "Minha Instituição" |
|------|--------------------------|
| Desktop (dropdown) | Presente (linha 207) |
| Mobile | **AUSENTE** |

### Código Atual do Desktop (funciona)

```tsx
// Linhas 206-216 - Desktop dropdown
{isInstitutionAdmin && !institutionAdminLoading ? (
  <DropdownMenuItem onClick={() => navigate(buildTenantPath(tenantSlug, '/portal-institucional'))}>
    <Building2 className="h-4 w-4 mr-2" />
    Minha Instituição
  </DropdownMenuItem>
) : (
  <DropdownMenuItem onClick={() => navigate(buildTenantPath(tenantSlug, '/agendamentos'))}>
    <Calendar className="h-4 w-4 mr-2" />
    Meus Agendamentos
  </DropdownMenuItem>
)}
```

### Código Atual do Mobile (falta o link)

```tsx
// Linhas 319-327 - Mobile menu - só tem "Meus Agendamentos" sempre
<Link
  to={buildTenantPath(tenantSlug, '/agendamentos')}
  ...
>
  <Calendar className="h-5 w-5 opacity-70" />
  Meus Agendamentos
</Link>
```

### Solução

Adicionar a mesma lógica condicional do desktop no menu mobile:

```tsx
// Seção "Minha Conta" no mobile (linhas ~319-327)
{isInstitutionAdmin && !institutionAdminLoading ? (
  <Link
    to={buildTenantPath(tenantSlug, '/portal-institucional')}
    className="text-sm py-2.5 px-3 rounded-lg hover:bg-accent/10 transition-colors flex items-center gap-3"
    onClick={() => setIsMenuOpen(false)}
  >
    <Building2 className="h-5 w-5 opacity-70" />
    Minha Instituição
  </Link>
) : (
  <Link
    to={buildTenantPath(tenantSlug, '/agendamentos')}
    className="text-sm py-2.5 px-3 rounded-lg hover:bg-accent/10 transition-colors flex items-center gap-3"
    onClick={() => setIsMenuOpen(false)}
  >
    <Calendar className="h-5 w-5 opacity-70" />
    Meus Agendamentos
  </Link>
)}
```

### Arquivo a Modificar

| Arquivo | Linhas | Mudança |
|---------|--------|---------|
| `src/components/ui/header.tsx` | 319-327 | Adicionar condicional `isInstitutionAdmin` para exibir "Minha Instituição" em vez de "Meus Agendamentos" |

### Resultado Esperado

Quando o usuário `institution_admin` acessar o menu mobile:

```text
---- Minha Conta ----
  🏛️ Minha Instituição    ← NOVO (em vez de "Meus Agendamentos")
  👥 Meus Encontros
  ⚙️ Meu Perfil
```

### Resumo

- **1 arquivo** a modificar
- **1 bloco condicional** a adicionar
- Paridade desktop/mobile restaurada

