# Bloco "Como interpretar os valores": deixar igual à referência

O que muda no cartão do instrumento selecionado (ex.: WHO-5), na Análise Integrada:

1. **Régua de faixas**
   - Faixas mais grossas e arredondadas, com cores suaves: vermelho claro (Muito baixo), laranja/pêssego (Baixo), verde-menta (Adequado e Alto).
   - Uma linha branca fina separa cada faixa.
   - Abaixo de cada faixa, o nome aparece na cor da faixa e o intervalo (ex.: 0–28) em cinza.

2. **Marcadores dos grupos**
   - Uma etiqueta para cada grupo (A, B, C...): círculo com a letra na cor do grupo e o valor ao lado (ex.: "B 50,7", "A 55,1").
   - Uma linha vertical fina desce de cada etiqueta até a régua.
   - Quando dois valores ficam muito próximos, as etiquetas se afastam para não se sobrepor.
   - Sem comparação, aparece só o marcador A e um marcador "Rede".

3. **Frases de leitura**
   - Uma linha para cada grupo: a letra colorida, o nome do grupo entre parênteses, o selo da faixa na cor da faixa e o intervalo. Ex.: "A (Todos os cursos · Toda a rede) está na faixa Adequado (51–75)."
   - Os grupos C, D... adicionados também aparecem.

4. **Cabeçalho do cartão**
   - Etiquetas "Faixa 0–100", "↑ maior é mais favorável" e "Coleta semestral · próxima <semestre seguinte>".
   - À direita: "Coleta semestral (i)", "Período em análise: 2026.2" e o link "Ver calendário de coletas" ("Em breve", sem ação por enquanto).
   - Uma linha divisória separa o cabeçalho do bloco de interpretação.

## Detalhes técnicos
- Alterar apenas `src/features/institution/comparator/IntegratedAnalysis.tsx`, no bloco da régua.
- As cores das faixas vêm de `TONE_BAR` / `TONE_CLASS` em `scaleBands.ts`. Adicionar tokens de texto por tom, sempre com cores semânticas em HSL.
- A largura de cada faixa segue o intervalo dela. Os marcadores usam a mesma posição percentual, com afastamento mínimo de cerca de 6% entre etiquetas.
- O próximo semestre é calculado a partir do semestre atual (2026.2 → 2027.1).
