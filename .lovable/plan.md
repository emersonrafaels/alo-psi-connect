

## Melhorar Distribuicao e Espacamento na Lista de Alunos

### Problemas identificados na screenshot
- As barras de metrica (Humor, Ansiedade, Energia, Sono) estao muito apertadas, especialmente com o padding-left de 72px que desperica espaco
- O sparkline e muito pequeno (72x24px) e fica comprimido entre outros elementos
- A linha do nome + badge + sparkline + botoes esta sobrecarregada, tudo junto

### Mudancas planejadas

**1. Layout do aluno em 2 linhas mais respiradas**
- Remover o padding-left excessivo (pl-[72px]) das metricas
- Primeira linha: nome + badge de risco + tendencia (lado esquerdo) e botao Triar (lado direito)
- Segunda linha: metricas em grid de 4 colunas ocupando toda a largura, com gap maior
- Sparkline movido para a segunda linha, ao lado das metricas, com tamanho maior (100x32px)

**2. Barras de metrica mais visiveis**
- Aumentar altura da barra de 1px (h-1) para 1.5px (h-1.5) para melhor visibilidade
- Aumentar gap entre colunas de metricas (gap-x-6 para gap-x-8)

**3. Sparkline maior e melhor posicionado**
- Aumentar de 72x24 para 100x32 pixels
- Posicionar como ultimo elemento na linha de metricas, com mais destaque

**4. Registros e Triado como badges na primeira linha**
- Manter badges de registros e status "Triado" na primeira linha junto ao botao
- Remover acumulo visual da area do sparkline

### Detalhes tecnicos

| Arquivo | Mudanca |
|---|---|
| `src/components/institution/StudentTriageTab.tsx` | Reorganizar layout dos alunos: remover pl-[72px], aumentar sparkline, aumentar barras, redistribuir elementos entre as 2 linhas |

Apenas ajustes de layout/CSS. Sem mudanca em logica ou dados.

