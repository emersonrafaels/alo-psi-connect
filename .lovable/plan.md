

## Integrar Notas Institucionais ao Sistema de Inteligencia

### Objetivo
Quando a instituicao cadastrar notas como "Semana de Provas" ou "Feriado", essas informacoes serao usadas como contexto no dashboard de bem-estar emocional, nos insights inteligentes, na IA preditiva (Inteligencia MEDCOS) e na triagem de alunos.

### Mudancas

**1. Hook `useInstitutionWellbeing.tsx` - Buscar notas e gerar insights contextuais**

- Importar e buscar notas da instituicao (`institution_notes`) que tenham datas sobrepostas ao periodo selecionado
- Adicionar insights automaticos baseados nas notas ativas. Exemplo: se existe uma nota tipo "event" com titulo "Semana de Provas" cujas datas coincidem com o periodo, gerar um insight do tipo `info` com mensagem como: "Semana de Provas em andamento - variações de humor e ansiedade podem ser esperadas neste periodo"
- Retornar as notas relevantes no objeto `WellbeingMetrics` (novo campo `activeNotes`)

**2. Dashboard `InstitutionWellbeingDashboard.tsx` - Mostrar contexto visual**

- Exibir um banner/card com as notas ativas no periodo selecionado (ex: "Semana de Provas: 10/02 - 14/02"), antes dos graficos
- Usar icones e cores por tipo de nota (event, alert, reminder, info) para contextualizar os dados visuais

**3. Edge Function `generate-predictive-wellbeing-insights` - Contexto para IA**

- Receber as notas institucionais como parametro adicional no body (`institutionalNotes`)
- Incluir as notas no prompt da IA para que a analise preditiva considere eventos institucionais (ex: "Ha uma semana de provas agendada, o que pode explicar aumento de ansiedade")
- Adicionar no `userPrompt` uma secao "CONTEXTO INSTITUCIONAL" com as notas ativas

**4. Hook `usePredictiveInsights.tsx` - Enviar notas para a Edge Function**

- Receber as notas como parametro adicional
- Incluir as notas no body da chamada `supabase.functions.invoke`
- Incluir notas no hash de dados para detectar mudancas (nova nota = novo insight)

**5. `StudentTriageTab.tsx` - Contexto na triagem**

- Buscar notas ativas da instituicao
- Mostrar um banner informativo no topo da triagem quando houver notas relevantes (ex: "Semana de Provas em andamento - considere este contexto ao avaliar os alunos")

### Detalhes tecnicos

| Arquivo | Acao |
|---|---|
| `src/hooks/useInstitutionWellbeing.tsx` | Buscar notas, filtrar por periodo, gerar insights contextuais, retornar `activeNotes` |
| `src/components/institution/InstitutionWellbeingDashboard.tsx` | Exibir banner de contexto institucional, passar notas ao hook preditivo |
| `supabase/functions/generate-predictive-wellbeing-insights/index.ts` | Receber e incluir notas no prompt da IA |
| `src/hooks/usePredictiveInsights.tsx` | Aceitar notas como parametro, enviar na chamada, incluir no hash |
| `src/components/institution/StudentTriageTab.tsx` | Buscar e exibir notas como contexto na triagem |

### Fluxo

1. Instituicao cria nota "Semana de Provas" com datas 10/02 a 14/02
2. Ao abrir o dashboard de bem-estar, o sistema busca notas com datas sobrepostas ao periodo
3. Um banner aparece: "Semana de Provas (10/02 - 14/02)" com icone de evento
4. Os insights locais incluem: "Semana de Provas em andamento - variacoes nos indicadores podem ser esperadas"
5. Ao gerar a Inteligencia MEDCOS, a IA recebe o contexto e diz: "O aumento de ansiedade observado coincide com a Semana de Provas registrada pela instituicao"
6. Na triagem, um aviso contextual aparece para o gestor considerar o evento ao avaliar os alunos

