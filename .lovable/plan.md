

## Reorganizar grafico de contagem diaria e adicionar graficos complementares

### Problema
O grafico "Diarios Emocionais por Dia" ocupa um card inteiro sozinho e fica desproporcional. Precisa ser integrado melhor no layout.

### Solucao

Mover o grafico de contagem diaria para dentro do card "Visao Geral" (linhas 260-319), abaixo dos 4 cards de metricas, e reduzir sua altura. Adicionar tambem um mini grafico de taxa de participacao ao lado, criando um grid 2 colunas com dois graficos menores e mais uteis.

**Arquivo:** `src/components/institution/InstitutionWellbeingDashboard.tsx`

1. **Remover** o card standalone "Diarios Emocionais por Dia" (linhas 321-361)
2. **Dentro do card "Visao Geral"** (apos o grid de 4 metricas, linha 317), adicionar um grid de 2 colunas com:
   - **Coluna 1**: Grafico de barras "Registros por dia" (altura reduzida: 180px em vez de 300px)
   - **Coluna 2**: Grafico de barras "Participacao por dia" mostrando o numero de alunos unicos por dia (usando `entries_count` ja disponivel, e adicionando uma linha de referencia com o total de alunos vinculados)

Para a participacao por dia, os dados ja estao em `daily_entries` mas so temos `entries_count`. Vou usar esse mesmo dado com label diferente e adicionar uma `ReferenceLine` com `totalStudentsLinked` para dar contexto visual.

3. Importar `ReferenceLine` do recharts

### Resultado
- Layout mais compacto: 2 graficos lado a lado dentro do card existente
- Graficos menores (180px) e mais proporcionais
- Contexto visual melhor com linha de referencia de total de alunos

