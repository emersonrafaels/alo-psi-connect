# Ajustes na Jornada Emocional: paisagem, práticas e check-out corporal

## Objetivo
Aproximar a Jornada Emocional das telas de referência anexadas, especialmente em três pontos: Paisagem Emocional, Regular Aprendizagem e Regular Check-out Corporal.

## Sua Paisagem Emocional
- Levar para a aba **Corpo** a imagem corporal com frente e costas, usando as marcações feitas pelo usuário na etapa Corpo.
- Mostrar as emoções/sensações selecionadas pelo usuário como camadas corporais, com cor, intensidade e regiões marcadas.
- Criar uma leitura semelhante ao HTML de referência:
  - área visual com corpo frente/costas;
  - card lateral com “Padrões que vêm aparecendo”;
  - seção “Regiões corporais mais recorrentes” com barras de frequência;
  - manter a aba **Emoções** com bolhas, leitura lateral, linha de intensidade e emoções deste check-in em nomes legíveis.
- Quando ainda não houver histórico salvo, usar o registro atual da sessão como base da visualização, sem mostrar tela vazia.

## Regular Aprendizagem
- Manter a prática recomendada em destaque.
- Adicionar uma seção **Outras práticas disponíveis**, semelhante à imagem anexada.
- Mostrar outras práticas ativas da trilha, com ícone, nome e descrição curta.
- Permitir selecionar uma alternativa sem voltar a uma tela anterior.
- Manter removida a opção de selecionar tempo.

## Regular Check-out Corporal
- Adicionar a opção **Mudou de lugar** ao lado de “Menos intenso”, “Igual”, “Mais intenso” e “Não sei”.
- Quando o usuário escolher **Mudou de lugar**, abrir um seletor de região corporal.
- Usar a lista completa de regiões do HTML/referência visível:
  - Cabeça - frente
  - Garganta - frente
  - Peito - frente
  - Abdômen - frente
  - Baixo ventre - frente
  - Ombros - frente
  - Braços - frente
  - Mãos - frente
  - Pernas - frente
  - Pés - frente
  - Nuca - costas
  - Costas altas - costas
  - Lombar - costas
  - Ombros - costas
  - Braços - costas
  - Mãos - costas
  - Pernas - costas
  - Pés - costas
- Salvar a nova região escolhida junto da camada corporal, preservando o histórico da sessão.

## Detalhes técnicos
- Atualizar os tipos da Jornada para incluir `after: "moved"` e a nova região escolhida após a prática.
- Reaproveitar/centralizar a lista de regiões corporais para o mapa, check-out e paisagem, evitando listas diferentes.
- Atualizar o estado e persistência da Jornada para gravar a região escolhida em “Mudou de lugar”.
- Adaptar `EmotionLandscape` para receber também o estado atual da sessão, especialmente emoções e camadas corporais.
- Adaptar `LearningResourceCard` para receber e renderizar alternativas de práticas.
- Usar componentes visuais existentes do projeto, mantendo as cores institucionais e sem adicionar bibliotecas novas.

## Validação
- Percorrer uma jornada completa selecionando emoções e regiões no corpo.
- Confirmar que a Paisagem Emocional mostra o corpo com as marcações feitas.
- Confirmar que “Outras práticas disponíveis” aparece na etapa Regular.
- Confirmar que “Mudou de lugar” abre o seletor e salva a região escolhida.
- Conferir computador e celular para evitar sobreposição de textos ou elementos.
