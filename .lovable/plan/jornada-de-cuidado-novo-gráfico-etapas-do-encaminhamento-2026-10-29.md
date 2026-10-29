# Jornada de cuidado — novo gráfico "Etapas do encaminhamento"

Substituir as barras horizontais atuais pelo fluxo do HTML/imagem de referência, usando os dados reais já carregados.

## O que muda na seção
- **Cabeçalho:** título + subtítulo ("N pessoas pediram apoio humano. Cada etapa é contada separadamente.") e, à direita, dois números grandes: dias do pedido à 1ª consulta (soma das médias entre etapas) e % que chegaram a atendimento.
- **Controles:** chips de unidade (Toda a instituição + cada unidade com iniciais em círculo) e alternância "Pessoas / % do pedido".
- **Gráfico em fluxo:** 6 colunas, cada etapa é um bloco vertical arredondado centralizado, com altura proporcional; entre blocos, uma faixa curva suave liga uma etapa à outra.
  - Acima de cada faixa: "−N" e o tempo até a próxima etapa; na última, "% continuam".
  - A maior perda até a 1ª consulta fica em rosa (faixa e texto); a última etapa em lilás mais claro.
  - Abaixo: nome da etapa, número grande e "% do pedido" (ou pessoas, no modo %).
- **Rodapé:** card rosa "Maior perda: entre X e Y" com texto explicativo, e card cinza "As N pessoas ainda não atendidas" com barra segmentada (em andamento / sem retorno / orientadas a outro recurso).
- Textos em "média" (não "mediana"), seguindo o padrão já pedido.

## Detalhes técnicos
- Só `src/features/institution/comparator/journey/JourneyView.tsx`; reutiliza `counts`, `losses`, `medians`, `worst`, `notReached`, `perUnit`.
- Chip de unidade local à seção (estado próprio), filtrando os mesmos fluxos já agregados; unidades abaixo de 10 pedidos continuam ocultas.
- Cores por tokens semânticos (primary, accent, `--highlight-pink`), sem hex fixo.
