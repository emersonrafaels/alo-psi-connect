# Jornada Emocional: voltar à roda e emoções independentes

## 1. Botão "Voltar à roda"
- Reproduzir no navegador o clique em "Voltar à roda" na tela "O que você gostaria de compreender melhor?" para confirmar por que a roda não reaparece (a ação só desliga a revisão; suspeita de algo reativando a revisão ou a roda ficando fora da tela).
- Corrigir para que o clique mostre a roda novamente, com as emoções já registradas preservadas na lateral, rolando até a roda e limpando a seleção atual para permitir escolher/ajustar outra emoção.

## 2. Qualquer emoção da roda é clicável
- Anel interno (ex.: Raiva), anel do meio (ex.: Irritado) e anel externo (ex.: Impaciente) passam a abrir diretamente a janela de intensidade da emoção clicada.
- Remover a regra que exigia descer até o terceiro nível e o esmaecimento das demais emoções; a roda fica sempre toda visível e clicável.
- Remover as etiquetas "Família emocional / Emoção mais precisa / Nuance emocional" e a trilha de navegação acima da roda.

## 3. Sem árvore de emoções
- Exibir apenas o nome da emoção escolhida (ex.: "Irritado") em: janela de intensidade, janela pós-registro, lateral "Emoções registradas", revisão e resumo final — sem "Raiva › Irritado › Impaciente".
- A cor continua vindo do grupo da roda, apenas como identidade visual.

## Detalhes técnicos
- `reducer.ts`: `SELECT_FAMILY`/`SELECT_LEVEL2`/`SELECT_LEVEL3` definem `pendingEmotionId` com o id clicado; `BACK_TO_WHEEL` também limpa `familyId/level2Id/level3Id/pendingEmotionId`.
- `EmotionWheelV11.tsx`: remover classes de opacidade condicionais; destaque só na emoção selecionada.
- `JornadaEmocionalV5.tsx`: remover `EmotionBreadcrumb` e chips de níveis; scroll até `wheelRef` após voltar.
- `IntensityDialog`, `AfterRegisterDialog`, `PerceiveSidebar`, `SessionSummary`: trocar `getEmotionPath(...).join(" › ")` por `getEmotionNode(id).label`.
- Validar com Playwright: Raiva → intensidade → registrar → revisão → Voltar à roda → Irritado.
