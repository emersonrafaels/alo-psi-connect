

## Melhorias de UX na Badge de Engajamento e Cards de Aluno

### 1. Badge "14/15 dias" mais explicativa

**Problema:** A badge atual mostra apenas `{entryCount}/{analysisPeriod} dias`, sem contexto. O usuario precisa interpretar o que isso significa.

**Solucao:** Transformar em uma badge mais descritiva com icone e cor condicional baseada no nivel de engajamento.

**Arquivo:** `src/components/institution/StudentTriageTab.tsx` (linhas 1030-1034)

De:
```text
[14/15 dias]
```

Para:
```text
[BookOpen icon] Diario: 14/15 dias  (verde se >= 80%, amarelo 50-79%, vermelho < 50%)
```

Detalhes:
- Adicionar icone `BookOpen` (ou `NotebookPen`) antes do texto
- Texto passa a ser: `Diario: {entryCount}/{analysisPeriod} dias`
- Cor da badge varia conforme engajamento:
  - Verde (`bg-green-100 text-green-700`): >= 80% de preenchimento
  - Amarelo (`bg-yellow-100 text-yellow-700`): 50-79%
  - Vermelho (`bg-red-100 text-red-700`): < 50%
  - Cinza (outline atual): 0 registros
- Tooltip atualizado: "Diario emocional preenchido em {entryCount} dos ultimos {analysisPeriod} dias. Engajamento: {percentual}%."

---

### 2. Indicador visual de engajamento (mini barra de progresso)

Adicionar uma mini barra de progresso dentro da badge ou ao lado, mostrando visualmente a proporcao de preenchimento. Isso torna o dado legivel instantaneamente sem ler numeros.

---

### 3. Seletor de periodo mais descritivo (linhas 840-846)

Atualizar as opcoes do `Select` de periodo para incluir descricoes mais claras:

De:
```
7 dias | 15 dias | 30 dias | 60 dias | 90 dias
```

Para:
```
Ultima semana (7d) | Quinzena (15d) | Ultimo mes (30d) | 2 meses (60d) | Trimestre (90d)
```

E adicionar abaixo do seletor as datas concretas em texto pequeno: `04/02 - 18/02`

---

### 4. Label "(t:3.2)" mais legivel nas metricas (linhas 1070, 1092, 1114)

**Problema:** O indicador de media da turma `(t:3.2)` e críptico.

**Solucao:** Substituir por um tooltip com icone de referencia. Ao passar o mouse, mostra "Media da turma: 3.2". O texto inline passa a mostrar apenas a seta de comparacao com a turma, ou um pequeno ponto colorido indicando se esta acima/abaixo da media.

---

### 5. Sparkline no card do aluno

A MoodSparkline ja existe como componente mas verificar se esta sendo exibida nos cards de aluno da aba "Para Triar". Se nao, incluir ao lado das metricas para dar contexto visual da evolucao do humor.

---

### Resumo dos arquivos afetados

| Arquivo | Acao |
|---|---|
| `src/components/institution/StudentTriageTab.tsx` | (1) Badge engajamento com cor e icone (linhas 1030-1034), (2) Select periodo descritivo (linhas 840-846), (3) Label turma legivel (linhas 1070, 1092, 1114), (4) Datas concretas abaixo do seletor |

