# Roda das emoções: modal de intensidade e várias emoções

Ajustar a etapa "Perceber" para funcionar como na página de referência: ao clicar em uma palavra na roda, abre uma janela perguntando a intensidade; ao registrar, a pessoa volta à roda e pode escolher mais emoções (até 3); depois segue para a revisão/foco e o passo a passo.

## Como vai funcionar

1. A pessoa clica em uma emoção na roda (ou na busca / lista completa).
2. Abre uma janela centralizada com:
   - Etiqueta "Intensidade" e a pergunta: Quanto "<Emoção>" está presente agora?
   - Frase de apoio: a intensidade é registrada separadamente da posição da palavra na roda.
   - Cinco botões (1 a 5) com "Muito pouco" à esquerda e "Muito intensamente" à direita.
   - Botões "Cancelar" e "Registrar emoção" (só ativa após escolher um número).
   - Aviso quando já houver 3 emoções registradas, sem permitir adicionar.
3. Ao registrar, a janela fecha e a pessoa continua na roda, agora com a emoção listada no painel lateral.
4. Enquanto houver menos de 3 emoções, aparece um convite claro para escolher outra emoção e um botão para seguir adiante.
5. Ao seguir, mostra a tela de revisão/foco (como na imagem 2), listando as emoções registradas com a intensidade, mais a opção de observar o momento como um conjunto, e então continua para "Compreender".
6. A pausa opcional de respiração, quando a intensidade é alta, passa a ser oferecida depois do registro, sem cobrir a roda.

## Detalhes técnicos

- Novo componente `src/features/jornada/v5/components/IntensityDialog.tsx` usando `Dialog` do shadcn, reaproveitando `INTENSITY_LABELS`, a cor da família e a `IntensityScale` (com estado local de valor selecionado, confirmando só no botão).
- `PerceiveSidebar.tsx`: remover o bloco inline de intensidade da emoção pendente; manter busca, lista das emoções registradas, remoção e reinício.
- `JornadaEmocionalV5.tsx`: renderizar `IntensityDialog` controlado por `state.pendingEmotionId`, com `onConfirm` disparando `CONFIRM_EMOTION` e fechamento disparando `CANCEL_PENDING`; ajustar a ordem de renderização para que o cartão de pausa apareça abaixo da roda e a transição para o foco use um botão explícito.
- Reducer sem alterações de contrato: `PICK_EMOTION` continua abrindo o pendente e `CONFIRM_EMOTION` gravando (limite `MAX_EMOTIONS = 3`).
- `FocusSelection.tsx` permanece como tela de revisão/foco.
- Validar com Playwright: registrar duas emoções via modal, cancelar uma, chegar à revisão e avançar para "Compreender", em desktop e mobile.
