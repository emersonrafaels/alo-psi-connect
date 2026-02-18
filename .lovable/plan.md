

## Corrigir Diario Emocional Nao Aparecendo no Modal de Atividade

### Causa raiz

Quando o modal abre, o `profileId` passado ao hook `useStudentActivityData` esta chegando como `null`. Isso faz com que a query de `mood_entries` seja PULADA (usando `Promise.resolve({ data: [] })`), resultando em "Nenhum registro emocional nos ultimos 30 dias" -- mesmo havendo dados no banco.

Evidencia: a request de `student_triage` aparece no network (feita pelo mesmo `Promise.all`), mas a de `mood_entries` NAO aparece -- ou seja, o `profileId` e falsy no momento da execucao.

### Correcao

**Arquivo: `src/hooks/useStudentActivityData.tsx`**

1. Adicionar fallback: se `profileId` for null mas `patientId` existir, buscar o `profile_id` na tabela `pacientes` antes de fazer a query de mood_entries
2. Adicionar `console.log` para depuracao das entradas e do profileId resolvido
3. Garantir que a query nao e pulada quando ha dados disponiveis

Mudanca principal no `queryFn`:

```text
// ANTES (pula mood_entries se profileId e null):
const [moodResult, triageResult] = await Promise.all([
  profileId
    ? supabase.from('mood_entries')...
    : Promise.resolve({ data: [], error: null }),
  ...
]);

// DEPOIS (busca profileId do paciente como fallback):
let resolvedProfileId = profileId;
if (!resolvedProfileId && patientId) {
  const { data: patient } = await supabase
    .from('pacientes')
    .select('profile_id')
    .eq('id', patientId)
    .single();
  resolvedProfileId = patient?.profile_id || null;
}

const [moodResult, triageResult] = await Promise.all([
  resolvedProfileId
    ? supabase.from('mood_entries')...eq('profile_id', resolvedProfileId)...
    : Promise.resolve({ data: [], error: null }),
  ...
]);
```

### Detalhes tecnicos

| Arquivo | Mudanca |
|---|---|
| `src/hooks/useStudentActivityData.tsx` | Adicionar fallback de profileId via pacientes.profile_id quando profileId e null. Adicionar console.log para depuracao. |

Sem mudancas no banco de dados. Sem novos arquivos.

