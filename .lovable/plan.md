## Objetivo
Fazer o KPI "Alunos ativos (7d)" do Portal Institucional exibir valores realistas para a UNIFAGOC (e para futuras instituições demo), que hoje aparece como **0**.

## Diagnóstico
O KPI conta `mood_entries.profile_id` distintos com `date >= hoje-7d` para alunos vinculados via `patient_institutions`. Os dados demo da UNIFAGOC geraram 990 registros de humor, mas distribuídos em uma janela histórica ampla — quase nenhum cai nos últimos 7 dias, por isso o card mostra 0.

## Plano

### Parte 1 — Backfill imediato da UNIFAGOC
Atualizar via SQL os `mood_entries` dos 33 alunos da UNIFAGOC para garantir atividade recente:
- Selecionar ~28 dos 33 alunos (≈85% engajamento) e, para cada um, "repor" de 2 a 5 registros dentro dos últimos 7 dias (datas espalhadas, sem duplicar `profile_id + date`).
- Estratégia: mover as datas dos registros mais recentes já existentes desses alunos para o intervalo `today-6d … today`, preservando os valores emocionais originais. Isso evita inserts novos e conflitos de unique constraint.
- Resultado esperado: ~28 alunos ativos (7d), engajamento ≈85%, sparkline com barras nos 7 dias e semana anterior ≈20–25 para gerar delta positivo.

### Parte 2 — Ajuste no seed para novas instituições
Editar `supabase/functions/seed-demo-data/index.ts` para que a geração de `mood_entries` garanta cobertura nos últimos 7 dias:
- Ao distribuir as datas dos registros por aluno, reservar N entradas (2–5) obrigatoriamente na janela `today-6d … today` para 80–90% dos alunos ativos.
- Manter o restante do histórico atual (30–60 dias) para os gráficos de tendência.

### Parte 3 — Verificação
- Recarregar `/portal-institucional` da UNIFAGOC e confirmar: card "Alunos ativos (7d)" > 0, "Engajamento" coerente, sparkline com dados, delta vs. semana anterior calculado.

## Detalhes técnicos
- Parte 1 usa `UPDATE public.mood_entries SET date = ...` com CTE de `row_number()` por `profile_id` para escolher quais registros mover, com `ON CONFLICT DO NOTHING` implícito via `WHERE NOT EXISTS`.
- Parte 2 ajusta a função helper de datas dentro do loop de seed de mood entries, sem alterar contagem total (990) nem schema.
- Nenhuma mudança em frontend ou no hook `useInstitutionExecutiveSummary` — a lógica já está correta.