
## Adicionar aba "Triagem" ao Portal Institucional

### Problema
A aba de Triagem foi criada apenas no portal admin (`/admin/portal-institucional`), mas nao existe no portal institucional real (`/portal-institucional`) que o institution_admin usa. A screenshot mostra exatamente essa pagina com 4 tabs: Visao Geral, Cupons, Metricas, Diario Emocional.

### Mudanca

**Arquivo: `src/pages/InstitutionPortal.tsx`**

1. Importar `ClipboardList` do lucide-react e o componente `StudentTriageTab`
2. Alterar o grid de tabs de 4 para 5 colunas (`grid-cols-2 md:grid-cols-5`)
3. Adicionar nova `TabsTrigger` com valor "triage" e icone `ClipboardList` com texto "Triagem"
4. Adicionar novo `TabsContent` para "triage" renderizando `StudentTriageTab` com o `institutionId` da instituicao do usuario

### Detalhes tecnicos

- O componente `StudentTriageTab` ja existe em `src/components/institution/StudentTriageTab.tsx` e recebe `institutionId` como prop
- O hook `useStudentTriage` ja busca dados via `patient_institutions` e `mood_entries`, compativel com RLS de institution_admin
- O `institutionId` sera obtido de `userInstitutions[0]?.institution_id`, mesmo padrao usado nas outras tabs

### Resumo de arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/InstitutionPortal.tsx` | Adicionar tab Triagem com StudentTriageTab |
