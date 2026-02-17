

## Visao do Portal Institucional no Painel Admin

### Objetivo

Criar uma nova pagina no painel admin (`/admin/portal-institucional`) que permite ao administrador selecionar qualquer instituicao cadastrada e visualizar os mesmos dados que o portal institucional exibe (profissionais, alunos, cupons, metricas, diario emocional), sem precisar ser vinculado a instituicao.

### Abordagem

Em vez de reutilizar `useInstitutionAccess` (que depende do usuario logado ser `institution_admin` vinculado), criar um hook administrativo que busca os dados diretamente por `institution_id` selecionado no dropdown.

### Mudancas

**1. Nova pagina: `src/pages/admin/AdminInstitutionPortal.tsx`**

- Select dropdown no topo com todas as instituicoes ativas (usando `useInstitutions`)
- Ao selecionar uma instituicao, exibir:
  - Cards de resumo (profissionais, alunos, taxa de atividade)
  - Tabs: Visao Geral, Cupons, Metricas, Diario Emocional (mesmas tabs do portal original)
  - Reutilizar componentes existentes: `InstitutionCouponsTab`, `InstitutionAnalyticsDashboard`, `InstitutionWellbeingDashboard`
- Para profissionais e alunos, buscar diretamente via `professional_institutions` e `patient_institutions` pelo `institution_id` selecionado (query admin, sem depender de `institution_users`)
- Layout usando `AdminLayout` (sidebar + header do admin)

**2. Hook: `src/hooks/useAdminInstitutionPortal.tsx`**

- Recebe `institutionId: string | null`
- Busca profissionais vinculados via `professional_institutions` filtrado por `institution_id`
- Busca alunos vinculados via `patient_institutions` filtrado por `institution_id`
- Retorna `{ linkedProfessionals, linkedStudents, isLoading }`
- Queries identicas as de `useInstitutionAccess`, mas sem depender de `institution_users` do usuario logado

**3. Rota: `src/App.tsx`**

- Adicionar rota `/admin/portal-institucional` com `AdminLayout`

**4. Menu: `src/components/admin/AdminSidebar.tsx`**

- Adicionar item "Portal Institucional" no grupo "Gestao de Pessoas", abaixo de "Instituicoes"
- Icone: `Building2`
- `requiredRole: 'admin'`

### Estrutura da pagina

```text
+----------------------------------------------+
| [Select: Escolha uma instituicao]            |
+----------------------------------------------+
| Cards: Profissionais | Alunos | Atividade    |
+----------------------------------------------+
| Tabs:                                        |
|  [Visao Geral] [Cupons] [Metricas] [Diario]  |
|                                              |
|  (conteudo da tab selecionada)               |
+----------------------------------------------+
```

### Detalhes tecnicos

- Os componentes `InstitutionCouponsTab`, `InstitutionAnalyticsDashboard` e `InstitutionWellbeingDashboard` ja recebem `institutionId` como prop, entao podem ser reutilizados diretamente
- Para a tab "Visao Geral", exibir lista resumida de profissionais e alunos com contadores e links para expandir
- As queries do hook admin usam RLS de admin (`is_admin(auth.uid())`) para acessar os dados sem precisar de vinculo em `institution_users`

### Resumo de arquivos

| Arquivo | Acao |
|---|---|
| `src/hooks/useAdminInstitutionPortal.tsx` | Novo hook - busca profissionais e alunos por institution_id |
| `src/pages/admin/AdminInstitutionPortal.tsx` | Nova pagina - portal institucional no admin |
| `src/App.tsx` | Adicionar rota /admin/portal-institucional |
| `src/components/admin/AdminSidebar.tsx` | Adicionar item no menu lateral |

