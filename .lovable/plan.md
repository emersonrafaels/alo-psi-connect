

## Corrigir coerência entre gráfico e métricas no painel ilustrativo

### Problema
O gráfico de barras tem 4 barras com alturas (65%, 85%, 55%, 75%) que não representam nenhuma das 3 métricas abaixo (87% Adesão, 4.8 Avaliação, 320 Atendimentos). As barras e os números contam histórias diferentes.

### Solução
Redesenhar o painel para que o gráfico reflita as métricas. Substituir as 4 barras genéricas por 3 barras que representam visualmente as 3 métricas:

**`src/pages/About.tsx` (linhas 395-422)**

- Substituir o gráfico de barras por 3 barras rotuladas que correspondem às métricas:
  - **Adesão**: 87% de altura (label "87%")
  - **Avaliação**: 96% de altura (4.8/5.0 = 96%)
  - **Atendimentos**: barra cheia como referência (320/mês)
- Adicionar labels embaixo de cada barra com o nome da métrica
- Remover os 3 cards separados abaixo — integrar os valores diretamente no gráfico (valor no topo de cada barra)
- Layout mais limpo: gráfico de barras com labels inline, sem duplicação de informação

Resultado: um único gráfico coerente onde barras e números contam a mesma história.

### Arquivo
- `src/pages/About.tsx` — linhas 395-422

