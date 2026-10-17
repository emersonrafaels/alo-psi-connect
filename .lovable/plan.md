# "O que os números dizem": deixar igual à referência

Ajustes no bloco de resumo da Análise Integrada:

1. **Cabeçalho**
   - Título pequeno em roxo e maiúsculas: "O QUE OS NÚMEROS DIZEM · 2026.2", com um ícone de informação (i).
   - À direita, um selo verde com o tamanho da diferença. Exemplo: "Diferença pequena".

2. **Frase principal e explicação**
   - Frase grande. Exemplo: "Todos os cursos · Toda a rede está em situação mais favorável que Todos os cursos · Afya Contagem."
   - Linha de apoio. Exemplo: "Em 2026.2, A marcou 55,1 e B marcou 50,7. Isso significa mais bem-estar em A, uma diferença de 4,4 pontos (4% da escala)."
   - O termo de significado muda com a escala: "mais bem-estar", "menos estresse", "menos sintomas de ansiedade" etc.

3. **Régua Pior → Melhor**
   - Barra fina com degradê: pêssego à esquerda, quase branco no meio, verde-menta à direita.
   - Marcadores em círculo, cada um com a letra na cor do grupo (A em roxo, B na cor de comparação).
   - O marcador de A fica acima da barra, com o rótulo "A · 55,1" e uma linha tracejada até a barra.
   - O marcador de B fica sobre a barra, com o rótulo "B · 50,7" logo abaixo.
   - As pontas da régua mostram "← Pior · 0" em laranja e "100 · Melhor →" em verde.

4. **Três cartões**
   - **Tamanho da diferença**: valor em verde e as frases "4,4 pontos de diferença, ou 4% da escala." e "A está do lado mais favorável."
   - **Tendência no tempo**: "Evolução", "Piora" ou "Estável", com as linhas "A: melhorou X pontos desde 2025.2." e "B: …".
   - **Confiança na leitura**: valor em verde e, para cada grupo, "1.083 respostas (54% do grupo) · confiança alta."

5. **Rodapé "Como ler"**
   - Separado por uma linha.
   - Texto que se adapta à escala. Exemplo: "Este indicador vai de 0 a 100 e quanto maior, melhor (mais bem-estar). A régua já está orientada para que a direita seja sempre o lado mais favorável…"

## Detalhes técnicos
- Alterar apenas o bloco correspondente em `src/features/institution/comparator/IntegratedAnalysis.tsx`.
- Usar a cor do grupo B que já existe (`gColor(0)`). Sem comparação, o B passa a ser "Rede", em cinza.
- Criar um pequeno mapa de "termo de significado" por código de escala (WHO5: bem-estar; PSS10: estresse; GAD7: sintomas de ansiedade…), com a direção ajustada para "mais" ou "menos".
- Calcular a confiança e a cobertura de B com a população do grupo B (`gPop`).
