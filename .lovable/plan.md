

## Sugestoes de Melhorias para o Sistema de Triagem / Portal Institucional

Apos analisar todo o codigo do portal institucional e sistema de triagem, identifiquei as seguintes oportunidades organizadas por impacto:

---

### 1. Triagem em Lote (Batch Triage)

Atualmente, o educador precisa triar aluno por aluno individualmente. Quando ha muitos alunos pendentes, isso e demorado.

**Proposta:** Adicionar checkboxes nos cards de alunos na aba "Para Triar" e um botao "Triar Selecionados" que abre um dialog simplificado para aplicar a mesma acao/prioridade a todos de uma vez.

---

### 2. Dashboard de Metricas da Triagem

Nao existe uma visao consolidada do trabalho de triagem realizado. O educador nao sabe quantas triagens foram feitas no mes, tempo medio de resolucao, etc.

**Proposta:** Adicionar um mini-dashboard no topo da aba de triagem com:
- Triagens realizadas este mes
- Tempo medio de resolucao (dias entre criacao e resolved_at)
- Taxa de resolucao (resolvidas / total)
- Grafico sparkline de triagens por semana

---

### 3. Notificacoes de Follow-up Vencido

Existem datas de follow-up nos registros de triagem, mas nao ha um sistema proativo de alerta. O educador precisa navegar ate a aba "Em Andamento" para ver quais estao vencidos.

**Proposta:** Adicionar um banner/alerta no topo (similar ao de criticos pendentes) mostrando "X triagens com follow-up vencido" com link direto para a aba "Em Andamento" filtrada.

---

### 4. Filtro por Periodo nas Abas de Historico

As abas "Concluidos" e "Todos" mostram todas as triagens sem filtro temporal. Com o tempo, a lista ficara muito grande.

**Proposta:** Adicionar um seletor de periodo (Ultima semana / Ultimo mes / Ultimos 3 meses / Todos) nessas abas para facilitar a navegacao.

---

### 5. Comparacao Temporal do Aluno

O modal de atividade do aluno mostra os ultimos 30 dias, mas nao compara com o periodo anterior. O educador nao consegue ver facilmente se o aluno melhorou ou piorou apos a triagem.

**Proposta:** No modal `StudentActivityModal`, adicionar uma secao "Antes vs Depois da Triagem" que compara as metricas dos 14 dias antes e depois da ultima triagem realizada.

---

### 6. Notas Rapidas na Listagem

Para adicionar uma observacao, o educador precisa abrir o dialog completo de triagem. As vezes, ele so quer anotar algo rapido.

**Proposta:** Adicionar um botao de "nota rapida" (icone de lapis) ao lado do botao "Triar" que abre um popover simples com um campo de texto, salvando como nota no registro de triagem existente ou criando uma anotacao avulsa.

---

### 7. Indicador de Engajamento do Aluno

Atualmente, so mostra "X reg." (registros), mas nao ha contexto de regularidade. Um aluno com 4 registros em 14 dias pode ter preenchido 4 dias seguidos e parado, ou 1 por semana.

**Proposta:** Substituir ou complementar o badge "X reg." com um indicador de regularidade (ex: "4/14 dias" ou um mini calendario de pontos mostrando quais dias o aluno preencheu).

---

### 8. Exportacao Avancada com Filtros

A exportacao atual exporta apenas a aba ativa. Nao inclui historico de triagens nem permite escolher o que exportar.

**Proposta:** Evoluir o botao "Exportar" para um dropdown com opcoes:
- Exportar alunos pendentes (atual)
- Exportar historico de triagens
- Exportar relatorio completo (alunos + metricas + triagens)

---

### Prioridade Sugerida

| Melhoria | Impacto | Esforco |
|---|---|---|
| 1. Triagem em Lote | Alto | Medio |
| 2. Dashboard de Metricas | Alto | Medio |
| 3. Alerta Follow-up Vencido | Alto | Baixo |
| 4. Filtro por Periodo | Medio | Baixo |
| 5. Comparacao Temporal | Alto | Alto |
| 6. Notas Rapidas | Medio | Baixo |
| 7. Indicador Engajamento | Medio | Baixo |
| 8. Exportacao Avancada | Medio | Medio |

Posso implementar qualquer combinacao dessas melhorias. Qual(is) voce gostaria de priorizar?

