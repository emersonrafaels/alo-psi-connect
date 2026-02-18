

## Indicador de Media da Turma nas Barras de Metrica

### O que sera feito

Adicionar um marcador elegante (seta/triangulo) nas barras de metrica de cada aluno, mostrando onde esta a media geral da turma. Isso permite ao educador comparar rapidamente se o aluno esta acima ou abaixo da media.

### Mudancas

**Arquivo: `src/components/institution/StudentTriageTab.tsx`**

1. **Calcular as medias gerais da turma** com um `useMemo` que agrega os valores de todos os alunos com dados:

```text
const classAverages = useMemo(() => ({
  mood: media de todos student.avgMood,
  anxiety: media de todos student.avgAnxiety,
  energy: media de todos student.avgEnergy,
  sleep: media de todos student.avgSleep,
}), [students]);
```

2. **Evoluir o componente `MetricBar`** para aceitar uma prop opcional `classAvg`:

```text
function MetricBar({ value, invert, classAvg }) {
  // Barra atual do aluno (sem mudancas)
  // + marcador da media da turma:
  //   Um pequeno triangulo (seta para baixo) posicionado
  //   horizontalmente na posicao da media
  //   com tooltip "Media da turma: X.X"
}
```

O marcador sera um triangulo SVG inline posicionado com `left: X%` via CSS absolute, apontando para baixo sobre a barra. Cor neutra (cinza/slate) para nao competir com a cor da barra do aluno.

3. **Passar `classAvg` em todas as chamadas de `MetricBar`** na listagem de alunos:

```text
<MetricBar value={student.avgMood} classAvg={classAverages.mood} />
<MetricBar value={student.avgAnxiety} invert classAvg={classAverages.anxiety} />
<MetricBar value={student.avgEnergy} classAvg={classAverages.energy} />
<MetricBar value={student.avgSleep} classAvg={classAverages.sleep} />
```

4. **Adicionar legenda sutil** abaixo dos cards de resumo ou no cabecalho "Indicadores (14 dias)", ex: um pequeno texto "▼ = media da turma" para que o usuario entenda o marcador.

### Visual do marcador

```text
         ▼  (triangulo cinza, 6px)
  ████████░░░░░░░░░░░  (barra do aluno)
  |------- 2.3 -------|  (escala 1-5)
```

- Triangulo apontando para baixo, posicionado no topo da barra
- Cor: `text-slate-400 dark:text-slate-500` (discreto)
- Tooltip ao passar o mouse: "Media da turma: 3.2"
- Transicao suave na posicao

### Detalhes tecnicos

| Arquivo | Mudanca |
|---|---|
| `src/components/institution/StudentTriageTab.tsx` | (1) Adicionar `useMemo` para calcular medias da turma. (2) Evoluir `MetricBar` com prop `classAvg` e marcador SVG triangulo. (3) Passar `classAvg` nas 4 chamadas de MetricBar. (4) Legenda sutil. |

Nenhum arquivo novo. Nenhuma mudanca no banco de dados.

