

## Configuracao de visibilidade de paginas por tenant

### Situacao atual

O sistema ja possui a infraestrutura de `modules_enabled` no tenant, com 5 modulos (blog, mood_diary, ai_assistant, professionals, appointments). Porem:

- O hook `useModuleEnabled` so e usado no **footer** - o header e as rotas nao filtram nada
- Paginas como "Encontros", "Sobre" e "Contato" nao estao na lista de modulos
- Um usuario pode acessar diretamente a URL de um modulo desabilitado

### Plano de correcao

**1. Expandir a lista de modulos** (`src/hooks/useModuleEnabled.tsx`)

Adicionar novos modulos ao type `ModuleName`:

```text
'blog' | 'mood_diary' | 'ai_assistant' | 'professionals' | 'appointments' | 'group_sessions' | 'contact' | 'about'
```

**2. Atualizar o painel admin** (`src/components/admin/TenantConfigTabs.tsx`)

Adicionar os novos modulos ao array `modules` e `moduleTooltips` no `ModulesConfigTab`:

| Modulo | Label | Tooltip |
|--------|-------|---------|
| group_sessions | Encontros em Grupo | Habilita/desabilita paginas de encontros e sessoes em grupo |
| contact | Contato | Habilita/desabilita a pagina de contato no menu |
| about | Sobre | Habilita/desabilita a pagina "Sobre" no menu |

**3. Filtrar navegacao no Header** (`src/components/ui/header.tsx`)

Usar `useTenant` para acessar `modules_enabled` e filtrar o array `navigation` antes de renderizar. Mapear cada item do menu para seu modulo correspondente:

```text
"Profissionais" -> professionals
"Encontros" -> group_sessions
"Diario Emocional" -> mood_diary
"Blog" -> blog
"Contato" -> contact
"Sobre" -> about
"Home" -> sempre visivel
```

**4. Criar componente ModuleGuard** (`src/components/ModuleGuard.tsx`)

Componente wrapper que verifica se o modulo esta habilitado. Se nao, redireciona para a home do tenant. Sera usado nas rotas do App.tsx:

```typescript
const ModuleGuard = ({ module, children }) => {
  const enabled = useModuleEnabled(module);
  const { tenant } = useTenant();
  if (!enabled) return <Navigate to={buildTenantPath(tenant?.slug, '/')} />;
  return children;
};
```

**5. Proteger rotas no App.tsx** (`src/App.tsx`)

Envolver rotas de modulos com `ModuleGuard`:

- `/blog`, `/blog/:slug` -> `ModuleGuard module="blog"`
- `/profissionais`, `/profissional/:id` -> `ModuleGuard module="professionals"`
- `/encontros`, `/encontros/:sessionId`, `/meus-encontros` -> `ModuleGuard module="group_sessions"`
- `/diario-emocional/*` -> `ModuleGuard module="mood_diary"`
- `/contato` -> `ModuleGuard module="contact"`
- `/sobre` -> `ModuleGuard module="about"`
- Repetir para rotas com prefixo `/medcos/`

**6. Atualizar tipo Tenant** (`src/types/tenant.ts`)

Adicionar os novos campos ao tipo `modules_enabled`:

```typescript
modules_enabled?: {
  blog?: boolean;
  mood_diary?: boolean;
  ai_assistant?: boolean;
  professionals?: boolean;
  appointments?: boolean;
  group_sessions?: boolean;
  contact?: boolean;
  about?: boolean;
  [key: string]: boolean | undefined;
};
```

### Arquivos afetados

| Arquivo | Alteracao |
|---------|-----------|
| `src/types/tenant.ts` | Adicionar novos modulos ao tipo |
| `src/hooks/useModuleEnabled.tsx` | Expandir ModuleName type |
| `src/components/admin/TenantConfigTabs.tsx` | Adicionar modulos ao painel |
| `src/components/ui/header.tsx` | Filtrar navegacao por modulo |
| `src/components/ModuleGuard.tsx` | **Novo arquivo** - guard de rota |
| `src/App.tsx` | Envolver rotas com ModuleGuard |

### Resultado esperado

- Admin pode habilitar/desabilitar 8 modulos por tenant
- Header esconde automaticamente links de modulos desabilitados
- Footer ja funciona (usa useModuleEnabled)
- Acesso direto via URL redireciona para home se modulo desabilitado
- Modulos habilitados por padrao (fallback seguro)

