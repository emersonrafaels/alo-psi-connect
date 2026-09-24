# Melhorias de UX na Jornada Emocional

## Objetivo
Aproximar a primeira etapa e as práticas internas da Jornada das referências enviadas, preservando o fluxo, as regras de intensidade e os dados já implementados.

## O que será alterado

### 1. Painel lateral da primeira etapa
- Refinar a hierarquia visual para reproduzir a referência: identificação “1 · Primeira percepção”, pergunta em destaque, busca, área de registro, ações e texto de apoio.
- Ajustar espaçamentos, bordas, tipografia, estados vazio/preenchido e proporção do painel sem alterar a roda emocional.
- Fazer o painel acompanhar o scroll para cima e para baixo enquanto a roda estiver visível, respeitando o cabeçalho e os limites da seção.
- No celular, manter o conteúdo em fluxo normal, sem painel flutuante ou sobreposição.

### 2. Explicação após intensidade máxima
- Na pausa opcional exibida para a primeira emoção desagradável com intensidade 5/5, mostrar uma frase dinâmica com a emoção registrada e a intensidade:
  - “Você marcou **[Emoção]** como sua primeira emoção e indicou intensidade **5/5**. Quando uma emoção desagradável está no nível máximo desta escala, a Rede Bem-Estar pode oferecer uma única pausa curta antes da continuidade, sem obrigar você a realizá-la.”
- Manter a regra atual: essa pausa aparece somente uma vez, apenas para a primeira emoção desagradável em 5/5; intensidade 4/5 não interrompe o fluxo.
- Preservar o aviso de segurança, a explicação do objetivo e as opções de fazer, pular ou salvar para depois.

### 3. Práticas dentro da Jornada
- Atualizar a apresentação e a execução das práticas para seguir o padrão visual já usado em `/praticas`: cabeçalho claro, duração, controles de som e saída, aviso de segurança, área central imersiva, animação orientadora, progresso, ciclos/tempo restante e ação de pausar/continuar.
- Aplicar o mesmo tratamento às práticas de respiração e às práticas em etapas, reutilizando padrões visuais e comportamentos existentes no site para manter consistência.
- Melhorar a adaptação em computador e celular, sem mudar os protocolos, tempos, critérios de recomendação ou conclusão da prática.
- Respeitar redução de movimento e manter controles acessíveis por teclado e leitores de tela.

## Validação
- Testar o painel lateral acompanhando scroll em computador e permanecendo estável no celular.
- Percorrer o fluxo com primeira emoção desagradável em 5/5 e confirmar o texto personalizado e a pausa única.
- Testar iniciar, pausar, continuar, silenciar, sair e concluir uma prática de respiração e uma prática por etapas.
- Conferir visualmente em computador e celular, além de validar ausência de erros na prévia.

## Detalhes técnicos
- Ajustes concentrados nos componentes da Jornada V5 e nos players compartilhados da jornada.
- Uso exclusivo dos tokens visuais e componentes de interface existentes da Rede Bem-Estar.
- Nenhuma alteração de banco de dados, permissões, cadastro ou regras de persistência.
