

## Corrigir vinculacao dos dados de diario emocional com alunos

### Problema

Os dados de mood_entries estao sendo criados com `profile_id` na seed function, mas o hook de triagem busca por `user_id`. Como os perfis demo nao tem `user_id` (nao sao usuarios reais do auth), a consulta nunca encontra os registros.

### Correcoes

**1. Hook de triagem: `src/hooks/useStudentTriage.tsx`**

Alterar a query de mood_entries para buscar por `profile_id` em vez de `user_id`:

- Em vez de extrair `user_id` dos profiles e filtrar por `.in('user_id', userIds)`, extrair os `profile_id` diretamente dos pacientes e filtrar por `.in('profile_id', profileIds)`
- Agrupar mood_entries por `profile_id` em vez de `user_id`
- Mapear cada aluno pelo seu `profile_id` para encontrar seus registros

**2. Seed function: `supabase/functions/seed-demo-data/index.ts`**

A seed function ja insere com `profile_id`, o que esta correto. Porem, tambem deve incluir `sleep_quality` (campo que o hook tenta ler), pois atualmente so insere `sleep_hours`.

Adicionar `sleep_quality` ao insert de mood_entries para que o hook de triagem consiga calcular o indicador de sono corretamente.

### Detalhes tecnicos

Mudanca no hook (logica central):

```
// ANTES: busca por user_id (nao existe em dados demo)
const userIds = students.map(s => s.pacientes.profiles.user_id).filter(Boolean);
.in('user_id', userIds)

// DEPOIS: busca por profile_id (sempre existe)
const profileIds = students.map(s => s.pacientes.profile_id);
.in('profile_id', profileIds)
```

Mudanca na seed function:

```
// ANTES
sleep_hours: values.sleep,

// DEPOIS
sleep_hours: values.sleep,
sleep_quality: values.mood,  // usar mood como proxy para qualidade do sono
```

### Resumo de arquivos

| Arquivo | Acao |
|---|---|
| `src/hooks/useStudentTriage.tsx` | Alterar query para usar profile_id em vez de user_id |
| `supabase/functions/seed-demo-data/index.ts` | Adicionar sleep_quality ao insert de mood_entries |

