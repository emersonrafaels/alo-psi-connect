## Ajustes no Dashboard de Bem-Estar Institucional

### 1) Concordância verbal no insight "Atenção requerida"

Arquivo: `src/hooks/useInstitutionWellbeing.tsx` (linha 328).

- Trocar `apresentou humor baixo no período` por **`apresentaram humor abaixo no período`** quando há mais de 1 aluno; manter singular `apresentou humor abaixo` para 1 aluno.
- Resultado: *"33 alunos (100%) apresentaram humor abaixo no período."*

### 2) Clareza no insight "Melhor dia"

Arquivo: `src/hooks/useInstitutionWellbeing.tsx` (linhas 351-367).

Hoje a descrição imprime só o nome do dia da semana (`Quinta-feira`), o que sugere padrão semanal, mas na verdade é **a data específica com a maior média** dentro do período.

- Passar a formatar como: `Quinta, 03/07 teve a melhor média de humor no período: 3.5/5.`
- Formato do dia: `weekday: 'short'` + `dd/MM` via `toLocaleDateString('pt-BR')`, para deixar explícito que é uma data única.
- Título passa a ser **"Melhor dia do período"**.

### 3) Cards da "Visão Geral" clicáveis com detalhes

Arquivo: `src/components/institution/InstitutionWellbeingDashboard.tsx` (linhas 289-331).

Tornar os 4 cards (Participantes, Registros, Tendência, Alertas) clicáveis, abrindo um `Dialog` com detalhes contextuais. Adicionar `role="button"`, `cursor-pointer`, hover state e foco de teclado.

Conteúdo de cada modal (usa dados já disponíveis em `metrics`):

- **Participantes** (`students_with_entries`): total, taxa de participação (`students_with_entries / students.length`), lista dos primeiros nomes anonimizados quando a instituição tiver anonimização ligada, e comparativo com período anterior se existir.
- **Registros** (`total_entries`): total, média por aluno (`total_entries / students_with_entries`), média por dia, e mini-tabela dos 5 dias com mais registros usando `metrics.daily_entries`.
- **Tendência** (`mood_trend` + `period_comparison`): média atual vs. média anterior, variação em % e explicação em texto do que "em melhora / em queda / estável" significa.
- **Alertas** (`students_with_low_mood`): explicação do critério (humor médio &lt; 3), quantidade absoluta e percentual, e CTA "Ver triagem" que já existe no portal (link para a aba Triagem — usa `onNavigateToTriage` opcional via prop; se não vier, apenas orienta em texto).

Componente novo enxuto: `src/components/institution/WellbeingMetricDialog.tsx` — recebe `type: 'participants' | 'entries' | 'trend' | 'alerts'`, `open`, `onOpenChange`, e `metrics`. Renderiza o conteúdo específico usando `Dialog` do shadcn.

### Escopo

- Só as mudanças acima. Sem alterar RPC, RLS, ou os gráficos.
- Sem trocar strings em outras telas.
