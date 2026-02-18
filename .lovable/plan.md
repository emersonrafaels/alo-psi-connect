

## Correcoes e Melhorias na Triagem de Alunos

### Problemas Identificados

1. **Legenda duplicada**: A linha "MEDIA DA INSTITUICAO" aparece repetida para cada aluno, e o texto mostra duas versoes redundantes ("media da instituicao" + "media da turma").
2. **Labels dos cards pouco visiveis**: Os textos "Critico", "Alerta", "Atencao" nos cards de resumo usam `text-muted-foreground`, ficando apagados.

### Correcoes

**Arquivo: `src/components/institution/StudentTriageTab.tsx`**

1. **Remover legenda duplicada por aluno (linha 570)** - Mover a legenda para fora do loop de alunos, exibindo-a uma unica vez acima da listagem. Texto unificado: "▼ = media da turma".

2. **Destacar labels dos cards de resumo (linha 392)** - Trocar `text-xs text-muted-foreground` por texto com a cor do respectivo nivel de risco, usando `font-semibold`:
   - Critico: `text-red-700 dark:text-red-400`
   - Alerta: `text-orange-700 dark:text-orange-400`
   - Atencao: `text-yellow-700 dark:text-yellow-400`
   - Saudavel: `text-green-700 dark:text-green-400`
   - Sem Dados: `text-muted-foreground`

### Melhorias Adicionais Sugeridas

3. **Valor numerico da media da turma nos cards** - Adicionar ao lado de cada card de resumo os valores medios da turma (ex: "Humor: 2.8 | Ansiedade: 3.2") como uma linha sutil, dando contexto numerico geral.

4. **Alerta visual para alunos criticos pendentes** - Quando houver alunos criticos nao triados, exibir um banner de alerta no topo (vermelho) com a contagem, chamando atencao imediata do educador.

5. **Indicador de comparacao na MetricBar** - Alem do triangulo, adicionar uma sutil diferenca visual: quando o valor do aluno estiver abaixo da media (ou acima, para ansiedade invertida), a cor do triangulo muda para vermelho claro; quando esta acima/melhor, muda para verde claro. Isso torna a comparacao instantanea sem precisar ler os numeros.

6. **Mostrar valor numerico da media no hover das barras** - Ao lado do valor do aluno (ex: "2.3"), mostrar a media da turma em texto menor entre parenteses: "2.3 (turma: 3.1)".

### Detalhes tecnicos

| Arquivo | Mudanca |
|---|---|
| `src/components/institution/StudentTriageTab.tsx` | (1) Extrair legenda da media para fora do loop, exibir uma vez antes da lista. (2) Adicionar `labelColor` ao `riskConfig` e usar nos cards. (3) Adicionar media geral nos cards de resumo. (4) Banner de alerta critico. (5) Triangulo com cor dinamica na MetricBar. (6) Media da turma inline nos valores das metricas. |

Nenhum arquivo novo. Nenhuma mudanca no banco de dados.

