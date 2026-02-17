
## Sistema de Triagem de Alunos no Portal Institucional

### Conceito

Criar uma nova tab "Triagem" no Portal Institucional que analisa automaticamente os dados emocionais dos alunos e os classifica em categorias de risco, permitindo ao admin/instituicao identificar rapidamente quem precisa de atencao e gerenciar o acompanhamento.

### Como Funciona

O sistema cruza os dados de `mood_entries` dos alunos vinculados a instituicao e calcula scores de risco baseados em padroes dos ultimos 14 dias:

```text
+-------------------------------------------------------+
| Tab: Triagem                                          |
+-------------------------------------------------------+
| [Filtros: Periodo | Categoria | Status de Triagem]    |
+-------------------------------------------------------+
| Cards de Resumo:                                      |
| [Critico: 3] [Alerta: 5] [Atencao: 8] [Saudavel: 12] |
+-------------------------------------------------------+
| Lista de Alunos com Classificacao:                     |
|                                                       |
| Nome       | Risco   | Indicadores     | Acao         |
| Maria S.   | CRITICO | Mood 1.2, Anx 5 | [Triar]      |
| Joao P.    | ALERTA  | Mood 2.1, Anx 4 | [Triar]      |
| Ana L.     | ATENCAO | Mood 2.8, Anx 3 | [Triar]      |
| Pedro M.   | SAUDAVEL| Mood 4.2, Anx 1 |              |
+-------------------------------------------------------+
| Alunos Triados (accordion):                           |
| - Maria S. | Triado em 15/02 | Notas: "Encaminhada"  |
+-------------------------------------------------------+
```

### Categorias de Risco (calculadas automaticamente)

| Categoria | Cor | Criterios |
|-----------|-----|-----------|
| **Critico** | Vermelho | Mood medio <=1.5 OU ansiedade >=4.5 OU tendencia de queda acentuada (>40%) |
| **Alerta** | Laranja | Mood medio <=2.5 OU ansiedade >=3.5 OU energia <=1.5 |
| **Atencao** | Amarelo | Mood medio <=3.0 OU ansiedade >=3.0 OU sono <=2.0 |
| **Saudavel** | Verde | Mood >3.0, ansiedade <3.0, sem indicadores negativos |
| **Sem Dados** | Cinza | Aluno sem registros no periodo |

### Funcionalidade de Triagem

Ao clicar em "Triar", abre um dialog onde o admin pode:
- Adicionar notas de observacao (texto livre)
- Selecionar prioridade (urgente, alta, media, baixa)
- Selecionar acao recomendada (encaminhar para profissional, agendar conversa, monitorar, contato com familia)
- Marcar como "triado"

Os dados de triagem sao persistidos em uma nova tabela `student_triage`.

### Mudancas Tecnicas

**1. Nova tabela: `student_triage`**

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid PK | |
| patient_id | uuid FK | Referencia ao paciente |
| institution_id | uuid FK | Referencia a instituicao |
| triaged_by | uuid | user_id de quem triou |
| status | text | pending, triaged, in_progress, resolved |
| risk_level | text | critical, alert, attention, healthy |
| priority | text | urgent, high, medium, low |
| recommended_action | text | refer_professional, schedule_talk, monitor, contact_family |
| notes | text | Observacoes livres |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| resolved_at | timestamptz | Quando foi resolvido |

RLS: admins podem tudo; institution_admins podem gerenciar da sua instituicao.

**2. Novo componente: `src/components/institution/StudentTriageTab.tsx`**

- Recebe `institutionId` como prop
- Busca alunos vinculados + suas mood_entries dos ultimos 14 dias
- Calcula score de risco para cada aluno
- Exibe cards de resumo por categoria
- Lista alunos ordenados por risco (criticos primeiro)
- Para cada aluno mostra: nome (anonimizado parcialmente), indicadores (mood medio, ansiedade, energia, sono), tendencia (seta), badge de risco, botao "Triar"
- Filtros: por categoria de risco, por status de triagem
- Secao expansivel "Alunos Triados" com historico

**3. Novo hook: `src/hooks/useStudentTriage.tsx`**

- `useStudentTriageData(institutionId)`: busca mood_entries dos alunos e calcula riscos
- `useTriageActions(institutionId)`: CRUD na tabela `student_triage`
- Logica de calculo de risco isolada em funcao pura para testabilidade

**4. Dialog de triagem: `src/components/institution/TriageDialog.tsx`**

- Formulario com campos: notas, prioridade, acao recomendada
- Exibe resumo dos indicadores do aluno selecionado
- Botao salvar persiste na tabela `student_triage`

**5. Atualizar `src/pages/admin/AdminInstitutionPortal.tsx`**

- Adicionar tab "Triagem" com icone `ClipboardList`
- Grid de tabs passa de 4 para 5 colunas
- Renderizar `StudentTriageTab` passando `institutionId`

### Resumo de arquivos

| Arquivo | Acao |
|---|---|
| Migration SQL | Criar tabela `student_triage` com RLS |
| `src/components/institution/StudentTriageTab.tsx` | Novo - tab principal de triagem |
| `src/components/institution/TriageDialog.tsx` | Novo - dialog para triar aluno |
| `src/hooks/useStudentTriage.tsx` | Novo - hook com logica de risco e CRUD |
| `src/pages/admin/AdminInstitutionPortal.tsx` | Adicionar tab Triagem |
