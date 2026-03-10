

## Adicionar opção "Diário Emocional apenas para logados" nos módulos do tenant

### O que fazer

Adicionar um sub-toggle dentro do módulo "Diário de Humor" que, quando ativado, bloqueia o acesso à página de experiência (`/diario-emocional/experiencia`) para usuários não logados, redirecionando-os para a página de login.

### Alterações

**1. `src/types/tenant.ts`** — Adicionar `mood_diary_guest_disabled` ao `modules_enabled`

**2. `src/components/admin/TenantConfigTabs.tsx`** — Adicionar checkbox condicional abaixo do "Diário de Humor":
- Só aparece quando `mood_diary` está habilitado
- Label: "Bloquear acesso para não logados"
- Tooltip: "Quando ativado, a página de experiência do diário emocional só é acessível para usuários logados"
- Salva em `modules_enabled.mood_diary_guest_disabled`

**3. `src/pages/MoodExperience.tsx`** — Verificar o flag do tenant:
- Importar `useTenant`
- Se `tenant.modules_enabled?.mood_diary_guest_disabled === true` e usuário não está logado → redirecionar para página de auth
- Se logado, funciona normalmente (já redireciona para o diário principal)

**4. `src/hooks/useModuleEnabled.tsx`** — Não precisa alterar, pois é um sub-flag do módulo existente, não um módulo novo.

