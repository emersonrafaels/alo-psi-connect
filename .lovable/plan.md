

## Melhorias Completas na Triagem de Alunos

### 1. Sugestao automatica de prioridade baseada no risco

Quando o gestor abrir o TriageDialog, a prioridade sera pre-selecionada automaticamente com base no nivel de risco do aluno:
- Critico -> Urgente
- Alerta -> Alta
- Atencao -> Media
- Saudavel/Sem Dados -> Baixa

O gestor pode alterar manualmente, mas a sugestao economiza tempo e reduz erros.

**Arquivo:** `src/components/institution/TriageDialog.tsx`

### 2. Historico de triagens anteriores no dialog

Ao abrir o dialog de triagem de um aluno, exibir as triagens anteriores daquele aluno (ultimas 5) em uma secao colapsavel abaixo do resumo. Cada registro mostrara: data, prioridade, acao recomendada, notas e status.

**Arquivos:** `src/components/institution/TriageDialog.tsx` (receber e exibir historico), `src/components/institution/StudentTriageTab.tsx` (passar triageRecords filtrados para o dialog)

### 3. Status "Em andamento" no workflow

Adicionar um botao "Em andamento" no historico de triagens (ao lado de "Resolver"), permitindo a transicao: Triado -> Em andamento -> Resolvido. O botao "Em andamento" so aparece quando o status e "triaged", e o botao "Resolver" aparece tanto para "triaged" quanto para "in_progress".

**Arquivo:** `src/components/institution/StudentTriageTab.tsx` (botao adicional no historico)

### 4. Campo de data de follow-up

Adicionar um campo opcional de data de follow-up no TriageDialog ("Acompanhamento ate"). Isso exige adicionar uma coluna `follow_up_date` (tipo date, nullable) na tabela `student_triage`.

No historico, triagens com follow-up mostrarao a data e um indicador visual se estiver vencida (cor vermelha) ou proxima (cor amarela).

**Arquivos:** 
- Migracao SQL: adicionar coluna `follow_up_date` a `student_triage`
- `src/components/institution/TriageDialog.tsx` (campo de data)
- `src/hooks/useStudentTriage.tsx` (enviar follow_up_date na mutation, atualizar interface)
- `src/components/institution/StudentTriageTab.tsx` (exibir follow-up no historico)

### 5. Sparklines de tendencia de humor

Exibir um mini-grafico (sparkline) na lista de alunos mostrando a evolucao do humor nos ultimos 14 dias. Sera um SVG inline simples (polyline) com ~60px de largura.

Para isso, os dados diarios de humor precisam ser retornados pelo hook `useStudentTriageData` (novo campo `moodHistory: number[]`).

**Arquivos:**
- `src/hooks/useStudentTriage.tsx` (retornar `moodHistory` no StudentRiskData)
- `src/components/institution/StudentTriageTab.tsx` (componente MoodSparkline inline)

### 6. Atribuicao - quem triou

Exibir o nome de quem realizou a triagem no historico. Isso requer buscar o nome do usuario via `triaged_by` (UUID) cruzando com `profiles`.

**Arquivos:**
- `src/hooks/useStudentTriage.tsx` (join com profiles na query de triageRecords, ou buscar nomes separadamente)
- `src/components/institution/StudentTriageTab.tsx` (exibir "por [Nome]" no historico)

---

### Detalhes tecnicos

| Mudanca | Arquivo(s) | Tipo |
|---|---|---|
| Sugestao automatica de prioridade | TriageDialog.tsx | Frontend |
| Historico no dialog | TriageDialog.tsx, StudentTriageTab.tsx | Frontend |
| Status "Em andamento" | StudentTriageTab.tsx | Frontend |
| Campo follow-up | Migracao SQL, TriageDialog.tsx, useStudentTriage.tsx, StudentTriageTab.tsx | DB + Frontend |
| Sparklines | useStudentTriage.tsx, StudentTriageTab.tsx | Frontend |
| Atribuicao (quem triou) | useStudentTriage.tsx, StudentTriageTab.tsx | Frontend |

### Sequencia de implementacao

1. Migracao SQL (adicionar `follow_up_date`)
2. Atualizar `useStudentTriage.tsx` (moodHistory, follow_up_date, triaged_by com nome)
3. Atualizar `TriageDialog.tsx` (sugestao de prioridade, historico, campo follow-up)
4. Atualizar `StudentTriageTab.tsx` (sparkline, botao "Em andamento", follow-up visual, nome de quem triou, passar historico ao dialog)

