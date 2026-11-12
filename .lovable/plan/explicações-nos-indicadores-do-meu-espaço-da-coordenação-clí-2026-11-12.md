# Explicações nos indicadores do Meu espaço da Coordenação clínica

## O que muda
1. **Caixa explicativa no topo** (pode ser fechada; a escolha fica salva no navegador): diz que os números são totais e médias da rede inteira, que os alunos aparecem como `Aluno #N`, que nenhum texto do diário é mostrado e que os níveis de sinal servem para triagem, não são diagnóstico.
2. **Ícone "i" com explicação ao passar o mouse ou tocar** em cada indicador:
   - Prioridades de hoje: Sinal elevado sem triagem, Prioridade alta em aberto, Retornos vencidos, Pedidos parados há mais de 3 dias, Triagens em aberto, Sinal elevado em 7 dias. Cada um diz o que conta, o período e o que fazer.
   - Níveis de sinal: Sinal elevado, Alerta, Atenção, Sem sinais prioritários, Dados insuficientes, explicando que o nível vem do último registro analisado de cada aluno.
   - Médias da rede: Humor, Ansiedade, Sono e Energia (escala de 1 a 5, comparadas com os 30 dias anteriores; na ansiedade, uma seta para baixo é melhora) e a % de alunos que registraram no diário em 7 dias.
   - Colunas da tabela Por instituição.
3. **Pequena nota abaixo do título** de cada bloco, explicando como ler aquele bloco.

## Detalhes técnicos
- Textos ficam em um mapa em `clinical/clinicalHomeLogic.ts`. Os ícones usam o Tooltip do shadcn dentro de um portal, para não ficarem escondidos atrás de outros elementos, e também abrem com o teclado.
- Os termos seguem as regras de triagem já combinadas. Nada muda nos dados nem nas permissões.
