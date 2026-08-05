# Buddy dos Alunos — emoji + melhorias

## Ajuste imediato
- Adicionar emoji 🧠 ao lado do rótulo da aba "Buddy dos Alunos" no Portal Institucional (`src/pages/InstitutionPortal.tsx`, linha ~329), mantendo o ícone atual ou substituindo-o pelo emoji para dar destaque visual.

## Melhorias propostas para a feature

### 1. Navegação e leitura do aluno
- Substituir o `Select` de alunos por uma lista lateral com busca, mostrando badge de atenção (alto / moderado / baixo) por aluno — hoje é preciso abrir um a um para descobrir quem precisa de acolhimento.
- Ordenação padrão por nível de atenção, depois por data do último registro.
- Indicador de "sem dados recentes" quando o insight estiver desatualizado (ex. mais de 15 dias).

### 2. Contexto acionável
- Card "O que fazer agora": traduzir os pontos de atenção em 2–3 ações de acolhimento sugeridas para o profissional institucional.
- Botão para registrar uma nota de acompanhamento vinculada ao aluno, reutilizando o fluxo de notas já existente no portal.
- Atalho para abrir a triagem daquele aluno na aba de Triagem.

### 3. Evolução no tempo
- Mini-gráfico (sparkline) dos indicadores de bem-estar, estabilidade, sono e hábitos ao longo dos períodos analisados, em vez de apenas o valor atual.
- Comparação "antes / depois" do último contato, seguindo o padrão de status colorido já usado na Triagem.

### 4. Privacidade e governança
- Exibir explicitamente, no painel, quem liberou o acesso e quando.
- Registrar em auditoria cada visualização do Buddy de um aluno (quem viu, qual aluno, quando) e expor esse histórico no admin.
- Respeitar a anonimização institucional também nos textos gerados (narrativa e retrato), não só no nome.
- Aviso ao aluno, na área do Buddy, de que a instituição tem acesso liberado.

### 5. Administração do acesso
- Ações em massa na aba admin: liberar/revogar todos, liberar por turma/curso.
- Data de validade opcional para a liberação, com revogação automática.
- Contadores de resumo (X visualizadores, Y alunos liberados) e busca nas duas listas.

### 6. Qualidade dos dados
- Botão para solicitar regeneração do insight de um aluno quando estiver ausente ou antigo.
- Mensagem de estado vazio mais útil, explicando o que o aluno precisa registrar para gerar o Buddy.

## Notas técnicas
- Arquivos envolvidos: `src/pages/InstitutionPortal.tsx`, `src/components/institution/StudentBuddyPanel.tsx`, `src/hooks/useInstitutionBuddyAccess.tsx`, `src/components/admin/InstitutionBuddyAccessTab.tsx`.
- Auditoria de visualização e validade de liberação exigem nova migração (tabela de log e coluna de expiração), a ser feita apenas se essas melhorias forem aprovadas.
- Sugestão de ordem: (1) emoji, (2) lista com busca e badges, (3) ações acionáveis + notas, (4) auditoria e validade, (5) sparklines.
