## Ajustes no NED Nacional

1. **Painel dos NEDs sem a coluna "Gestão"**
   - Tirar a coluna "Gestão em dia" da tabela do painel. Ela some também da linha de referência nacional.
   - O indicador "Gestão em dia" continua na ficha do NED e na boa prática "Relatório mensal".

2. **Trocar mediana por média em todos os indicadores**
   - A comparação de cada NED (melhor, perto ou pior) passa a usar a média nacional.
   - Isso vale para as cores da tabela, os KPIs, os alertas, os pontos fortes e de atenção, as demandas, as linhas tracejadas do gráfico e as boas práticas.
   - Todos os textos passam de "mediana" para "média": "Média nacional", "Melhor que a média", "Médias nacionais", "traço = média nacional" e assim por diante.

3. **Gráfico "Procura x tamanho da equipe"**
   - Cada círculo terá tamanho proporcional aos dias de espera. Hoje o tamanho vem do número de estudantes.
   - As cores continuam iguais: roxo para espera de até 7 dias e rosa acima disso.
   - A legenda ganha a nota "tamanho do círculo = dias de espera".
   - Visual mais suave, como na imagem:
     - círculos mais leves, sem borda grossa;
     - linhas tracejadas mais claras;
     - eixos discretos, com marcas de 2 h a 10 h;
     - rótulos dos quadrantes em letra menor;
     - nomes dos NEDs ao lado dos círculos, não em cima;
     - o NED selecionado fica marcado com um anel.

### Detalhes técnicos
- Em `nedLogic.ts`: criar `mean()` e usá-la no lugar de `median()` em `enrich` e no cálculo de `demMed`. Renomear `vsMedian` para `vsMean`. Atualizar os textos dos alertas e o tooltip "Espera", e ajustar os testes.
- Em `NedView.tsx`: na tabela, filtrar `METRICS` sem `ges`. Calcular o raio dos círculos com `r = 6 + (esp / maxEsp) * 10`. Adicionar `fill-opacity` e marcas nos eixos.
