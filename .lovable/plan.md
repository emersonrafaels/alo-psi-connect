

## Adicionar dados de sono para alunos existentes

### Problema

450 registros de mood_entries possuem `sleep_hours` mas `sleep_quality = NULL`. O hook de triagem so busca `sleep_quality` e nao faz fallback para `sleep_hours`.

### Solucao (duas partes)

**1. Backfill no banco de dados**

Executar UPDATE para preencher `sleep_quality` nos registros existentes, convertendo `sleep_hours` (escala 3-9) para escala 1-5:

```sql
UPDATE mood_entries
SET sleep_quality = ROUND(LEAST(5, GREATEST(1, (sleep_hours - 3) / 1.5 + 1)))::integer
WHERE sleep_quality IS NULL AND sleep_hours IS NOT NULL;
```

Isso vai corrigir os 450 registros de uma vez.

**2. Fallback no hook: `src/hooks/useStudentTriage.tsx`**

Adicionar `sleep_hours` ao select da query e implementar fallback no calculo de `avgSleep`:

- Alterar linha 105: adicionar `sleep_hours` ao select
- No calculo do sono (linhas ~145-148), usar `sleep_quality` quando disponivel, senao converter `sleep_hours` para escala 1-5

```typescript
// Na query (linha 105):
.select('profile_id, mood_score, anxiety_level, energy_level, sleep_quality, sleep_hours, date')

// No calculo (onde filtra sleepEntries):
const sleepEntries = entries.filter((e: any) => e.sleep_quality != null || e.sleep_hours != null);
const avgSleep = sleepEntries.length > 0
  ? sleepEntries.reduce((sum: number, e: any) => {
      const val = e.sleep_quality ?? Math.min(5, Math.max(1, Math.round((e.sleep_hours - 3) / 1.5 + 1)));
      return sum + val;
    }, 0) / sleepEntries.length
  : null;
```

### Resumo

| Item | Acao |
|---|---|
| Banco de dados | UPDATE para preencher sleep_quality em 450 registros |
| `src/hooks/useStudentTriage.tsx` | Adicionar sleep_hours ao select e fallback no calculo |

