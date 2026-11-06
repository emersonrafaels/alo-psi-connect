## Prática do dia com link direto

Hoje o card "Prática do dia" no Meu espaço mostra um nome fixo (rodízio por dia da semana) e o botão "Praticar agora" leva só para a lista geral de práticas.

### O que muda
- A prática do dia passa a ser escolhida entre as práticas reais publicadas na plataforma (mesma lista da página Práticas), com rodízio diário estável — todos veem a mesma prática no mesmo dia.
- O nome exibido é o da prática real.
- "Praticar agora" abre diretamente a página dessa prática (`/praticas/<prática>`), respeitando o prefixo da instituição (ex.: Medcos), e a página abre no topo.
- Se a lista ainda estiver carregando ou vazia, o botão continua levando para a página geral de Práticas.

### Detalhes técnicos
- Em `src/pages/StudentHome.tsx`, trocar o array fixo por `usePraticas()`; escolher `praticas[diaDoAno % praticas.length]` e linkar `p(\`/praticas/${slug}\`)`.
