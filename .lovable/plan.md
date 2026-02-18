

## Tooltips Mais Elegantes e UX Aprimorado na Pagina de Triagem

### Problemas atuais
- Tooltips sao simples caixas de texto sem hierarquia visual
- Cards de resumo de risco sao compactos demais, sem clareza visual
- Lista de alunos e densa, com metricas amontoadas em uma unica linha
- Icone de interrogacao (?) e muito pequeno e pouco visivel

### Melhorias planejadas

**1. Tooltips mais elegantes**
- Criar um componente `MetricTooltip` reutilizavel com:
  - Titulo em negrito separado da descricao
  - Icone contextual (colorido) no topo do tooltip
  - Largura fixa (280px) para consistencia
  - Fundo com leve gradiente e borda sutil
  - Separador visual entre titulo e explicacao
- Substituir todos os tooltips atuais pelo novo componente

**2. Cards de resumo de risco redesenhados**
- Aumentar o padding dos cards para respirar mais
- Adicionar porcentagem ao lado da contagem (ex: "3 (12%)")
- Icone de risco maior e mais destacado
- Barra de progresso com cor correspondente ao nivel de risco (vermelho para critico, verde para saudavel)
- Tooltip integrado ao card inteiro (nao apenas no icone ?)
- Efeito hover mais pronunciado com sombra e scale sutil

**3. Lista de alunos com melhor UX**
- Reorganizar metricas em grid 2x2 ao inves de linha unica
- Cada metrica com barra de progresso colorida (1-5) ao lado do valor
- Sparkline maior e mais visivel
- Tendencia com badge colorido mostrando a porcentagem (ex: badge vermelho "-61%")
- Separar visualmente nome/risco das metricas
- Botao "Triar" com variante mais chamativa para alunos criticos (vermelho)
- Badge "Triado" com icone de check

**4. Pequenas melhorias gerais**
- Remover icone HelpCircle dos cards de risco (tooltip no hover do card inteiro e mais intuitivo)
- Adicionar contagem de registros como badge discreto
- Hover nos cards de risco com animacao suave (transform scale)

### Detalhes tecnicos

| Arquivo | Mudanca |
|---|---|
| `src/components/institution/StudentTriageTab.tsx` | Redesign dos cards de risco, novo layout de metricas por aluno, tooltips elegantes, melhorias visuais gerais |

Mudanca em um unico arquivo. Sem impacto em logica, dados ou banco.

