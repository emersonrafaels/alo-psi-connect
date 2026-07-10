## Diagnóstico

O card **"Bem-estar do diário emocional"** mostra `Atualmente: 0` mesmo com 33 alunos e 990 registros porque a função RPC `get_institution_mood_aggregates` faz o join errado.

Confirmei no banco (UNIFAGOC, id `7e77a2…f602e4`):

| Verificação | Resultado |
|---|---|
| Alunos vinculados à instituição | **33** |
| Alunos com `profiles.user_id` preenchido | **0** |
| Registros de humor casados via `profile_id` | **990** (33 alunos distintos) |
| Registros de humor casados via `user_id` (lógica atual) | **0** |

A RPC atual liga `mood_entries.user_id → profiles.user_id`. Os alunos demo (e qualquer aluno criado sem conta auth) têm `profiles.user_id = NULL`, então o join zera. As entradas de humor sempre têm `profile_id`, e a tabela `mood_entries` tem coluna `profile_id`.

Também é o mesmo motivo pelo qual o card fica vazio para alunos importados via bulk sem convite de auth.

## Correção

Migration para recriar `public.get_institution_mood_aggregates` com o join via `profile_id`:

- Substituir a subquery `patient_institutions … profiles.user_id = me.user_id` por join direto:
  `mood_entries me` → `profiles p ON p.id = me.profile_id` → `pacientes pa ON pa.profile_id = p.id` → `patient_institutions pi ON pi.patient_id = pa.id AND pi.institution_id = p_institution_id`.
- Contagem `unique_users` passa a ser `COUNT(DISTINCT me.profile_id)` (mantém a k-anonimidade ≥ 5, agora considerando o aluno e não a conta auth).
- Mesma reescrita no bloco `risk_distribution` (join `mood_entry_analyses → mood_entries → profiles → pacientes → patient_institutions`).
- Mantém `SECURITY DEFINER`, o check de permissão (super_admin ou admin da instituição) e o retorno JSONB atual — nenhuma mudança de contrato para o frontend.

## Verificação

Após a migration, rodar:

```sql
SELECT get_institution_mood_aggregates(
  '7e77a230-bc9b-4b82-924d-8dfae908c0a6', 90);
```

Esperado: `available: true`, `unique_users: 33`, `total_entries: 990`, médias e `risk_distribution` preenchidos. Depois recarregar `/portal-institucional` → aba **Diário Emocional** e confirmar visualmente os cards.

## Escopo

- Apenas a função SQL. Nada muda no frontend, em RLS, ou em outras RPCs.
- Card **"Visão Geral"** logo abaixo já usa outro caminho (por isso mostra 33/990 corretamente) e não é tocado.
