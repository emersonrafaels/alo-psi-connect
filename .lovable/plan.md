

## Corrigir dados de sono faltantes na triagem

### Problema

Os dados demo existentes no banco foram criados antes da correcao que adicionou `sleep_quality`. Por isso, todos os registros atuais tem `sleep_quality = NULL`, resultando em "Sono: --" na triagem.

O codigo da seed function ja foi corrigido (linha 262), mas os dados antigos nao foram regenerados.

### Solucao (duas partes)

**1. Backfill dos dados existentes (SQL direto)**

Atualizar os registros existentes que tem `sleep_quality = NULL` mas possuem `sleep_hours`, usando uma formula de conversao:
- `sleep_hours` vai de ~3 a ~9
- Converter para escala 1-5: `ROUND(LEAST(5, GREATEST(1, (sleep_hours - 3) / 1.5)))`

Isso sera feito via Run SQL no painel.

**2. Fallback no hook: `src/hooks/useStudentTriage.tsx`**

Alterar o hook para usar `sleep_quality` quando disponivel, mas fazer fallback para uma conversao de `sleep_hours` quando `sleep_quality` for NULL. Isso garante compatibilidade com dados antigos e novos:

- Na query, adicionar `sleep_hours` ao select
- No calculo de `avgSleep`, usar `sleep_quality ?? convertSleepHours(sleep_hours)` para cada entrada
- Funcao de conversao: `Math.min(5, Math.max(1, Math.round((hours - 3) / 1.5)))`

**3. Seed function: sem mudanca necessaria**

A seed function ja inclui `sleep_quality` (correcao anterior). Dados novos virao corretos.

### Resumo de arquivos

| Arquivo | Acao |
|---|---|
| `src/hooks/useStudentTriage.tsx` | Adicionar fallback sleep_hours para sleep_quality no calculo |

Apos aprovar, tambem fornecerei o SQL para backfill dos dados existentes.

