
## Corrigir Dados Demo para Aparecer no Modal de Atividade do Aluno

### Problemas Identificados

1. **Mood entries sem `emotion_values`**: A seed function nao preenche o campo `emotion_values` (jsonb), entao a secao "Sentimentos predominantes" do modal fica vazia
2. **Sem registros de triagem demo**: A seed function nao cria registros na tabela `student_triage`, entao a aba "Historico de Triagens" fica vazia
3. **Limpeza incompleta**: A funcao de cleanup nao limpa registros de `student_triage` criados por demo

### Mudancas

#### 1. Edge Function `seed-demo-data/index.ts`

**Adicionar `emotion_values` nas mood entries:**
- Cada pattern tera um mapa de emocoes associadas (ex: `exam_stress` -> `{ansiedade: 4, medo: 3, frustração: 2}`)
- Os valores serao gerados proporcionalmente ao estado emocional daquele dia

**Nova funcao `seedTriageRecords`:**
- Para cada aluno, criar 1-3 registros de triagem demo com datas passadas realistas
- Distribuir status entre `triaged`, `in_progress`, `resolved`
- Usar prioridades e acoes recomendadas coerentes com o nivel de risco do aluno
- O campo `triaged_by` usara um UUID fixo de demo (ou o admin placeholder)
- Adicionar notas contextuais ao padrao emocional do aluno

**Atualizar cleanup:**
- Adicionar limpeza de `student_triage` vinculados aos pacientes da instituicao demo

**Atualizar fluxo principal (`seed_all` e `create_institution`):**
- Chamar `seedTriageRecords` apos criar alunos

#### 2. Hook `useStudentActivityData.tsx`

**Adicionar tratamento de erro no query:**
- Logar erro no console se a query de mood_entries falhar silenciosamente
- Garantir que `emotion_values` retornado como `{}` default nao quebre o calculo de top emotions

### Detalhes tecnicos

| Arquivo | Mudanca |
|---|---|
| `supabase/functions/seed-demo-data/index.ts` | Adicionar `emotion_values` em cada PATTERN_CONFIG, inserir no mood_entries. Nova funcao `seedTriageRecords`. Atualizar cleanup para limpar `student_triage`. |
| `src/hooks/useStudentActivityData.tsx` | Adicionar console.error para erros silenciosos nas queries de mood_entries e student_triage |

### Estrutura de `emotion_values` por padrao

- **exam_stress**: `{ansiedade: 4, medo: 3, frustração: 3, preocupação: 4}`
- **progressive_improvement**: valores que melhoram progressivamente
- **burnout**: `{exaustão: 4, desânimo: 3, apatia: 3}`
- **healthy**: `{calma: 4, gratidão: 3, motivação: 3}`
- **volatile**: alternancia entre emocoes positivas e negativas
- **random**: mix aleatorio

### Estrutura dos triagem demo

Para cada aluno, gerar 1-2 registros:
- Prioridade baseada no risk_level do padrao (exam_stress/burnout -> urgent/high, healthy -> low)
- Status variado: ~40% triaged, ~30% in_progress, ~30% resolved
- Datas de criacao distribuidas nos ultimos 30 dias
- Notas contextuais como "[DEMO] Aluno apresenta sinais de estresse academico"
