

## Tooltips Explicativos e Modais de Detalhamento

### Objetivo

Adicionar tooltips/hovers explicativos em todos os elementos comparativos e botoes de "maximizar" nos cards principais para abrir modais com detalhes expandidos.

### Mudancas

**1. Tooltips nos comparativos - `StudentTriageTab.tsx`**

Onde adicionar tooltips explicativos:

- **Deltas nos cards de resumo** (linhas 569-576): O `(+3)` / `(=)` / `(-1)` ganha tooltip explicando: "No periodo comparativo (DD/MM - DD/MM), havia X alunos criticos. Houve um aumento/reducao de Y."
- **Deltas nas medias da turma** (linhas 595-631): Cada `(+0.3)` / `(=)` ganha tooltip: "No periodo anterior, a media de humor era X.X. A variacao foi de +0.3."
- **Setas nos indicadores dos alunos** (linhas 952-956, 969-973, etc.): As setas ArrowUp/ArrowDown ganham tooltip: "Periodo anterior: X.X | Atual: Y.Y | Variacao: +Z.Z"
- **DeltaIndicator no TriageMetricsDashboard** (linhas 12-22): Tooltip explicando a variacao no numero de triagens

**2. Botao Maximizar nos cards - `StudentTriageTab.tsx`**

Adicionar icone `Maximize2` nos seguintes cards:

- **Cards de resumo de risco** (critical/alert/attention/healthy/no_data): Ao clicar no botao maximizar, abre um Dialog mostrando:
  - Lista dos alunos naquele nivel de risco
  - Criterios de classificacao
  - Se comparador ativo: tabela comparativa mostrando quais alunos mudaram de nivel
  
- **Card "Medias da turma"**: Maximizar para mostrar:
  - Tabela com todas as metricas detalhadas
  - Distribuicao dos valores (min, max, mediana)
  - Se comparador ativo: evolucao de cada metrica entre periodos

- **Cards do TriageMetricsDashboard** (triagens no periodo, tempo medio, taxa de resolucao, sparkline): Maximizar para mostrar:
  - Detalhamento das triagens por status
  - Historico semanal em formato tabela
  - Se comparador: comparativo detalhado

**3. Novo componente `ComparisonTooltip`**

Componente reutilizavel que encapsula a logica de tooltip comparativo:
- Recebe: `currentValue`, `previousValue`, `label`, `periodLabel`, `invertBetter`
- Renderiza: tooltip com "Atual: X | Anterior: Y | Variacao: Z"

**4. Novo componente `DetailModal`**

Componente generico de modal para detalhamento:
- Recebe: `title`, `children`, `open`, `onOpenChange`
- Renderiza: Dialog com conteudo expandido

### Arquivos afetados

| Arquivo | Acao |
|---|---|
| `src/components/institution/StudentTriageTab.tsx` | Adicionar tooltips nos deltas, botoes maximizar nos cards, estados para modais, conteudo dos modais |
| `src/components/institution/TriageMetricsDashboard.tsx` | Adicionar tooltips nos DeltaIndicator, botoes maximizar em cada card, modal de detalhamento |

### Detalhes dos tooltips

**Cards de resumo (delta):**
"Periodo comparativo (04/01 - 03/02): 0 alunos criticos. Variacao: +3 alunos."

**Medias da turma (delta):**
"Humor no periodo anterior: 3.5. Atual: 3.8. Melhora de +0.3 pontos."

**Setas nos alunos:**
"Humor anterior: 2.1 | Atual: 3.4 | Melhora de +1.3"

**TriageMetricsDashboard:**
"Periodo anterior: X triagens. Periodo atual: Y triagens. Variacao: +Z."

### Detalhes dos modais

Cada modal tera:
- Cabecalho com titulo e icone
- Corpo com dados tabulares ou em lista
- Secao comparativa (quando comparador ativo)
- Botao de fechar

Os botoes de maximizar serao icones pequenos (`Maximize2`, 14px) posicionados no canto superior direito dos cards, com hover sutil.

