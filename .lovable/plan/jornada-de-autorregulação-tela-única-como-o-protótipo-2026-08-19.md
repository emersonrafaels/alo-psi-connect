# Jornada de Autorregulação — tela única como o protótipo

Transformar a jornada em uma experiência de página única (todos os passos visíveis e numerados, como no protótipo), com a roda de emoções funcionando em 3 níveis, práticas sugeridas e o bloco de curadoria com a foto da Anne.

## O que muda na tela

Hoje cada etapa substitui a anterior. Passa a ser uma única página com seções numeradas empilhadas, reveladas conforme o preenchimento (igual ao protótipo):

```text
[ Stepper: 1 Família · 2 Emoção · 3 Intensidade · 4 Contexto · 5 Recomendação · 6 Prática · 7 Checkout ]   [Reiniciar fluxo]

1. Selecione uma família emocional        [roda grande]   |  [card lateral: nome da família + descrição + chips do nível 2]
2. Escolha uma emoção                     [grid de cards nível 2] + barra "Você selecionou X" → Confirmar e continuar / Refinar no nível 3
3. Refinamento opcional (nível 3)         [grid de cards] + barra "Refinamento selecionado" → Usar nível 2 / Confirmar
4. Quanto essa emoção está presente?      [breadcrumb Raiva → Dor → Envergonhado] + escala 1–5 (Pouco…Muito forte) → Continuar
5. O que você mais precisa neste momento? [4 opções em grid] → Ver recomendação
6. Práticas recomendadas para você        [prática principal + 2 alternativas]  |  [card "Por que recomendamos isso?" + curadoria Anne]
7. Prática em andamento (player)
8. Como você está agora? (checkout)
```

Comportamento:
- Cada seção só aparece depois que a anterior é respondida; ao clicar em um passo já respondido, a página rola até ele e permite trocar a resposta (as respostas seguintes são limpas quando a emoção muda).
- Stepper no topo com o passo atual destacado, marca de concluído nos anteriores e botão "Reiniciar fluxo".
- Sem painel de debug JSON.
- Entrada em duas opções (regular / entender) segue como está, antes da tela única.

## Roda de emoções

- Roda permanece grande e centralizada na coluna esquerda, com o núcleo "Como você está?" e a marca bem-estar.
- Clicar numa família: destaca o setor, abre o card lateral com descrição e as palavras do nível 2, e revela automaticamente a seção 2 (as opções do nível 2 aparecem em cards, como no protótipo, além do anel).
- Anéis 2 e 3 continuam navegáveis na roda; clicar no núcleo volta um nível. Roda e cards ficam sincronizados (selecionar num lugar reflete no outro).
- Busca por palavra e a lista completa em accordion continuam disponíveis, agora ancoradas na seção 1.

## Práticas e curadoria

- Seção 6 exibe a prática principal com selo "Mais indicada" e até duas alternativas, cada uma com ícone, duração, categoria e botão de play que inicia o player na seção 7.
- Card lateral "Por que recomendamos isso?" com a frase de justificativa (emoção + intensidade + necessidade escolhida) e os benefícios da prática em lista com check.
- No rodapé desse card, bloco de curadoria: foto da Anne, "CURADORIA DAS PRÁTICAS", nome e a nota de revisão. A foto vem do perfil dela na plataforma (profissional cadastrado), com fallback para as iniciais caso a imagem não carregue.

## Detalhes técnicos

- `src/features/jornada/pages/JornadaSessao.tsx`: reescrita para layout de tela única com seções controladas por `state.stage` + presença de respostas, refs para scroll suave e um novo `JourneySection` (título numerado, badge de nível, estado bloqueado/concluído).
- Novos componentes em `src/features/jornada/components/`: `JourneyStepper.tsx`, `EmotionLevelCards.tsx` (grids nível 2 e 3 com barra de confirmação), `WhyThisPractice.tsx` (justificativa + benefícios + curadoria), `CuratorBadge.tsx`.
- `EmotionWheel.tsx`: ajustes visuais (destaque do setor ativo, contraste dos rótulos, tamanho responsivo) mantendo a API atual de callbacks.
- `journeyReducer.ts`: ações para navegar entre passos já respondidos sem sair da tela única (`GOTO_STAGE`) e para escolher/limpar o nível 3 mantendo o nível 2 confirmado.
- Curadoria: hook leve consultando `profissionais` (id 2 / Anne) para `foto_perfil_url`, com URL de fallback embutida e `Avatar` do shadcn.
- Recomendação continua 100% determinística pelo `recommend()` atual — nenhuma mudança nas regras nem IA.
- Cores e espaçamentos via tokens do design system existentes; sem cores hardcoded.
