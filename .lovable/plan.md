# Corrigir sobreposição do botão de áudio no "Pedir apoio"

O botão "Gravar áudio" hoje fica por cima do campo de mensagem e cobre o texto.

## Ajuste
- Tirar o botão de dentro do campo de texto.
- Colocar uma linha logo abaixo do campo com o botão "Gravar áudio" à esquerda e o contador "0/1000" à direita.
- O campo de texto volta a ter a largura toda, sem espaço reservado à direita.

## Detalhes técnicos
- Em `SupportRequestDialog.tsx`: remover o wrapper `relative`/`absolute` e o `pr-12`; criar `div flex items-center justify-between` com `VoiceInputButton` e o contador.
