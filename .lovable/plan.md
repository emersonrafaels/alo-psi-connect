

## Corrigir ordem dos títulos na timeline do cadastro profissional

### Problema
O componente `TimelineProgress.tsx` tem títulos padrão desatualizados (8 títulos antigos). Com a adição da etapa "Formação acadêmica" como Step 4, os títulos na timeline ficaram dessincronizados com o conteúdo real de cada step. O step 4 mostra "Resumo" na timeline mas renderiza "Formação acadêmica", e o step 9 mostra "Passo 9" (fallback).

### Solução
Atualizar o array `defaultTitles` em `src/components/register/TimelineProgress.tsx` para refletir os 9 steps corretos:

```
'Dados Pessoais', 'Profissão', 'Perfil', 'Formação', 'Resumo', 'Especialidades', 'Horários', 'Credenciais', 'Revisão'
```

### Arquivo impactado
- `src/components/register/TimelineProgress.tsx` — uma linha alterada

