

## Plano: Adicionar Dados de Qualidade do Sono para UNICAMP

### Problema Identificado

A instituição UNICAMP (educational_institution) possui:

| Métrica | Valor |
|---------|-------|
| Total de registros | 484 |
| Com `sleep_quality` | 0 (0%) |
| Com `sleep_hours` | 484 (100%) |
| Média de horas de sono | ~6h |

Por isso o dashboard mostra "N/A" para Qualidade do Sono - não existem dados de `sleep_quality`.

### Solução

Preencher `sleep_quality` com valores derivados das `sleep_hours` existentes usando uma fórmula realística:

| Horas de Sono | Qualidade Estimada |
|---------------|-------------------|
| >= 8 horas | 5 (Excelente) |
| 7-8 horas | 4 (Bom) |
| 6-7 horas | 3 (Moderado) |
| 5-6 horas | 2 (Ruim) |
| < 5 horas | 1 (Muito ruim) |

### Query de Atualização

```sql
UPDATE mood_entries me
SET sleep_quality = CASE
  WHEN sleep_hours >= 8 THEN 5
  WHEN sleep_hours >= 7 THEN 4
  WHEN sleep_hours >= 6 THEN 3
  WHEN sleep_hours >= 5 THEN 2
  ELSE 1
END
WHERE me.profile_id IN (
  SELECT p.profile_id
  FROM patient_institutions pi
  JOIN pacientes p ON pi.patient_id = p.id
  WHERE pi.institution_id = 'da361619-8360-449a-bdd9-45d42bba77a0'
)
AND me.sleep_quality IS NULL
AND me.sleep_hours IS NOT NULL;
```

### Resultado Esperado

- 484 registros atualizados com `sleep_quality`
- Dashboard mostrará média de qualidade do sono (~3.2/5 baseado nas horas)
- Insights de correlação sono-energia passarão a funcionar

### Ação

Executar a migration SQL acima para preencher os dados faltantes.

