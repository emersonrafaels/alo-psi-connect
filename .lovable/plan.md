

## Padroes de Dados Demo para Diarios Emocionais

### Objetivo

Adicionar opcao de selecionar "padroes de dados" ao gerar dados demo, para que os diarios emocionais dos alunos sigam cenarios realistas em vez de valores totalmente aleatorios. Isso torna as demonstracoes muito mais convincentes.

### Padroes propostos

| Padrao | Descricao | Comportamento dos dados |
|--------|-----------|------------------------|
| **Semana de Provas** | Estresse academico intenso | Mood baixo (1-2), ansiedade alta (4-5), energia baixa (1-3), sono reduzido (3-5h), tags: #provas #estresse #ansiedade |
| **Melhora Progressiva** | Aluno em acompanhamento terapeutico | Mood começa em 1-2 e sobe gradualmente ate 4-5 ao longo dos dias, ansiedade diminui, sono melhora |
| **Burnout Academico** | Esgotamento cronico | Mood 1-3 constante, energia muito baixa (1-2), ansiedade moderada-alta, sono irregular, tags: #esgotamento #cansaco |
| **Saudavel/Estavel** | Aluno equilibrado | Mood 3-5, ansiedade baixa (1-2), energia boa (3-5), sono regular (7-9h), tags: #calma #foco |
| **Altos e Baixos** | Instabilidade emocional | Mood oscila entre 1 e 5 de forma irregular, ansiedade variavel, padrao sinusoidal |
| **Aleatorio (atual)** | Completamente aleatorio | Comportamento atual sem padrao |

### Mudancas

**1. Frontend: `src/pages/admin/DemoData.tsx`**

- Adicionar secao "Padrao de Dados" com checkboxes multi-selecao dos padroes acima
- Cada padrao tera icone, nome e breve descricao
- Quando multiplos padroes sao selecionados, os alunos sao distribuidos entre eles (ex: 10 alunos com 3 padroes = ~3-4 alunos por padrao)
- Padrao "Aleatorio" selecionado por default
- Passar o array de padroes selecionados no payload para a edge function

**2. Hook: `src/hooks/useDemoData.tsx`**

- Adicionar campo `dataPatterns?: string[]` ao tipo `DemoDataParams`
- Passar como `data_patterns` no body da requisicao

**3. Edge Function: `supabase/functions/seed-demo-data/index.ts`**

- Receber `data_patterns` no payload (default: `["random"]`)
- Refatorar `seedMoodEntries` para aceitar padroes
- Distribuir alunos entre os padroes selecionados
- Para cada padrao, gerar mood entries com valores coerentes:

```text
Logica por padrao:

exam_stress:
  - Ultimos 7 dias: mood 1-2, anxiety 4-5, energy 1-3, sleep 3-5h
  - Dias anteriores: mood 3-4, anxiety 2-3 (contraste)
  - Tags: #provas, #estresse, #ansiedade
  - Journal: textos sobre pressao de provas

progressive_improvement:
  - Dia mais antigo: mood 1-2, anxiety 4-5
  - Dia mais recente: mood 4-5, anxiety 1-2
  - Interpolacao linear entre eles
  - Tags: #terapia, #progresso, #autoconhecimento

burnout:
  - mood 1-3 constante, energy 1-2, anxiety 3-4, sleep 4-6h
  - Tags: #esgotamento, #cansaco, #sobrecarga

healthy:
  - mood 3-5, anxiety 1-2, energy 3-5, sleep 7-9h
  - Tags: #calma, #foco, #equilibrio

volatile:
  - mood oscila usando sin() + ruido, entre 1-5
  - anxiety inversamente proporcional ao mood
  - Tags variados

random:
  - Comportamento atual (sem mudanca)
```

- Adicionar arrays de journal_text especificos por padrao
- Adicionar arrays de tags especificos por padrao

### Resumo de arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/admin/DemoData.tsx` | Adicionar UI de selecao de padroes com checkboxes |
| `src/hooks/useDemoData.tsx` | Adicionar `dataPatterns` ao tipo e ao payload |
| `supabase/functions/seed-demo-data/index.ts` | Implementar geracao de mood entries por padrao |

