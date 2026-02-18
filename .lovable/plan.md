

## Redesign do Workflow de Triagem com Abas de Status

### Problema atual
- A lista de alunos mistura triados e nao triados em um unico card
- O historico de triagens e um collapsible escondido no final da pagina, misturando todos os status (Triado, Em Andamento, Resolvido)
- Nao ha visao clara de quantos alunos estao em cada etapa do workflow

### Solucao proposta

Substituir a estrutura atual (lista unica + collapsible) por um sistema de **sub-abas** dentro da aba Triagem, separando claramente cada etapa do fluxo:

```text
+-------------------------------------------------------------+
| [Para Triar (12)] [Em Andamento (3)] [Concluidos (5)] [Todos]|
+-------------------------------------------------------------+
```

**Sub-aba "Para Triar"** (padrao):
- Mostra apenas alunos que ainda nao foram triados ou com status "pending"
- Ordenados por risco (critico primeiro)
- Layout atual dos cards de aluno (nome, metricas, sparkline, botao Triar)
- Counter em vermelho se houver criticos

**Sub-aba "Em Andamento"**:
- Mostra triagens com status "triaged" ou "in_progress"
- Card redesenhado com:
  - Nome do aluno, prioridade (badge colorido), acao recomendada
  - Data da triagem e quem triou
  - Follow-up com indicador visual (vencido/proximo)
  - Notas da triagem
  - Botoes de acao: "Marcar Em Andamento" / "Resolver"
- Separacao visual entre "Triado" e "Em Andamento" com headers de secao

**Sub-aba "Concluidos"**:
- Triagens com status "resolved"
- Cards mais compactos (ja finalizados)
- Data de resolucao visivel
- Opcao de reabrir se necessario

**Sub-aba "Todos"** (historico completo):
- Todas as triagens ordenadas por data (mais recente primeiro)
- Filtro por status inline

### Mudancas visuais adicionais
- Badges de contagem em cada sub-aba com cores contextuais (vermelho para pendentes, amarelo para em andamento, verde para concluidos)
- Cards de triagem em andamento com borda lateral colorida por prioridade (vermelho=urgente, laranja=alta, amarelo=media, verde=baixa)
- Remover o Collapsible de historico (substituido pelas sub-abas)
- Remover filtro "Status de triagem" do select (agora e feito pelas abas)

### Detalhes tecnicos

| Arquivo | Mudanca |
|---|---|
| `src/components/institution/StudentTriageTab.tsx` | Adicionar sub-tabs (Tabs do Radix) para separar "Para Triar", "Em Andamento", "Concluidos" e "Todos". Remover Collapsible de historico e select de filtro de triagem. Redesenhar cards de triagem com borda lateral por prioridade. Adicionar contadores coloridos nas abas. |

Apenas um arquivo modificado. Sem mudancas em banco de dados ou logica de negocio.

