

## Correcao: Dados Demo com 0 Profissionais e 0 Alunos

### Problema Identificado

Os logs da edge function `seed-demo-data` mostram que a acao `seed_all` foi executada para "Carta Consulta" mas com `professionals_count = 0` e `students_count = 0`. Isso resultou em nenhum profissional ou aluno sendo criado.

**Causa raiz**: Quando os campos numericos do formulario ficam vazios ou sao limpos, `Number("")` retorna `NaN`, que e serializado como `null` no JSON. O destructuring com defaults (`professionals_count = 5`) nao se aplica a `null` — apenas a `undefined`. Resultado: os valores chegam como `null` (falsy) e sao interpretados como 0 nos loops.

### Correcoes

**1. Edge Function: `supabase/functions/seed-demo-data/index.ts`**

Adicionar validacao/fallback apos o destructuring para garantir valores minimos:

```text
// Apos o destructuring na linha 354:
const safeProfCount = professionals_count || 5;
const safeStudentCount = students_count || 10;
const safeMoodCount = mood_entries_per_student || 12;
```

Usar esses valores `safe*` nas chamadas de `seedProfessionals`, `seedStudents` e `seedMoodEntries`.

**2. Frontend: `src/pages/admin/DemoData.tsx`**

Corrigir os handlers `onChange` dos inputs numericos para garantir que nunca enviem 0 ou NaN:

```text
// De:
onChange={(e) => setAddDataProfCount(Number(e.target.value))}

// Para:
onChange={(e) => setAddDataProfCount(Math.max(1, Number(e.target.value) || 5))}
```

Aplicar a mesma logica para todos os 6 campos numericos (3 do formulario de criar instituicao + 3 do formulario de adicionar dados).

**3. Hook: `src/hooks/useDemoData.tsx`**

Adicionar fallbacks no payload enviado para a edge function:

```text
professionals_count: params.professionalsCount || 5,
students_count: params.studentsCount || 10,
mood_entries_per_student: params.moodEntriesPerStudent || 12,
```

### Resumo de arquivos

| Arquivo | Acao |
|---|---|
| `supabase/functions/seed-demo-data/index.ts` | Adicionar fallbacks para contadores nulos/zero |
| `src/pages/admin/DemoData.tsx` | Validar inputs numericos com valores minimos |
| `src/hooks/useDemoData.tsx` | Adicionar fallbacks no payload |

### Nota

Apos a correcao, o usuario precisara executar "Adicionar Dados" novamente para a instituicao "Carta Consulta" para gerar os profissionais e alunos.

