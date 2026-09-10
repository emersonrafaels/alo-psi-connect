/**
 * Textos da Jornada Emocional V5 — copiados da experiência de referência.
 * Nenhum texto aqui interpreta a experiência da pessoa nem conclui melhora clínica.
 */

export const V5_COPY = {
  pageTitle: "Jornada emocional",
  pageSubtitle:
    "Um espaço para perceber, compreender, regular e agir com mais clareza — sem respostas prontas e sem transformar um registro isolado em diagnóstico.",

  phases: [
    { key: "perceive", label: "Perceber", hint: "Roda e intensidade" },
    { key: "comprehend", label: "Compreender", hint: "Panorama do momento" },
    { key: "regulate", label: "Regular", hint: "Recurso e autonomia" },
    { key: "act", label: "Agir", hint: "Controle e próximo passo" },
    { key: "record", label: "Registro", hint: "Resumo e Paisagem" },
  ] as const,

  perceive: {
    eyebrow: "Perceber",
    title: "Explore livremente o que está presente",
    description:
      "A roda inteira permanece disponível. As cores organizam o vocabulário visualmente; elas não determinam uma sequência psicológica obrigatória.",
    principle:
      "Princípio da experiência: guiar a atenção sem guiar a resposta. Você pode começar em qualquer palavra e mudar sua percepção ao explorar o restante da roda.",
    sidebarEyebrow: "Primeira percepção",
    sidebarTitle: "O que você sente espontaneamente neste momento?",
    sidebarDescription:
      "Clique em qualquer palavra. Você não precisa começar pelo centro ou seguir uma ordem.",
    recordLabel: "Seu registro neste momento",
    emptyRecord:
      "Nenhuma emoção registrada ainda. Clique em uma palavra e informe quanto ela está presente.",
    limitNote:
      "Você pode registrar até três emoções. O limite reduz a carga da atividade; não significa que sua experiência esteja restrita a três sentimentos.",
    exploreAnother: "Explorar outra emoção",
    restart: "Recomeçar este registro",
  },

  pause: {
    eyebrow: "Pausa opcional",
    title: "Talvez seja útil criar um pouco de espaço antes de continuar",
    lead: "O objetivo não é eliminar a emoção.",
    description:
      "A proposta é recuperar disponibilidade suficiente para observar, compreender e decidir o próximo passo com menos sobrecarga.",
    safety:
      "A prática é opcional. Respire em um ritmo confortável, sem forçar. Em caso de desconforto, retome sua respiração natural e encerre.",
    accept: "Fazer uma respiração breve",
    decline: "Continuar sem a prática",
    later: "Salvar e voltar depois",
    playerEyebrow: "Regulação imediata",
    playerDescription:
      "Inspire suavemente por aproximadamente cinco segundos e expire suavemente por aproximadamente cinco segundos. Ajuste o ritmo ao que for confortável.",
    chips: ["1 minuto", "Ritmo confortável", "Sem retenção do ar", "Interrompa se houver desconforto"],
    reassessEyebrow: "Reavaliar",
    reassessTitle: "Como está a intensidade agora?",
    reassessNote:
      "Esta é uma nova medição da mesma ocorrência emocional. Ela não será contada como um segundo registro na sua Paisagem Emocional.",
  },

  focus: {
    eyebrow: "Perceber · revisão",
    title: "O que você gostaria de compreender melhor?",
    description:
      "Escolher um foco apenas organiza a reflexão. Isso não define qual prática é correta e não significa que as outras emoções sejam menos importantes.",
    alternative:
      "Alternativa: você também pode observar o momento como um conjunto, especialmente quando as emoções parecem difíceis de separar.",
    wholeLabel: "Observar o momento como um conjunto",
    back: "Voltar à roda",
    next: "Continuar para compreender",
  },

  comprehend: {
    eyebrow: "Compreender",
    title: "Panorama do momento",
    description:
      "Quatro observações curtas para separar o que aconteceu, o que o corpo mostrou, o que você fez e o que você pensou.",
    dimensions: [
      {
        key: "situation",
        label: "Situação ou fonte de estresse",
        help: "Procure localizar o contexto: onde você estava, o que acontecia e quem estava envolvido, se isso fizer sentido.",
        question: "O que estava acontecendo quando você percebeu essas emoções?",
        why: "Separar o fato do significado ajuda a ver a situação com menos sobrecarga.",
        placeholder:
          "Descreva o momento com suas palavras. Não é necessário encontrar uma explicação perfeita.",
      },
      {
        key: "body",
        label: "Corpo",
        help: "Observe sem tentar mudar imediatamente. Também é válido não perceber nada com clareza.",
        question: "O que você percebe em seu corpo neste momento?",
        why: "O corpo costuma sinalizar antes das palavras. Notar isso amplia a percepção.",
        placeholder:
          "Registre sensações, ritmo, tensão, temperatura, respiração ou ausência de sinais claros.",
      },
      {
        key: "behavior",
        label: "Comportamento e impulso",
        help: "Descreva ações ou impulsos, sem classificar como certos ou errados.",
        question: "O que você sente vontade de fazer ou costuma fazer diante disso?",
        why: "Reconhecer a reação não é julgá-la. É perceber onde existe alguma margem de escolha.",
        placeholder:
          "Ex.: evitar, conversar, acelerar, parar, pedir ajuda, ficar em silêncio ou algo diferente.",
      },
      {
        key: "thoughts",
        label: "Pensamentos e diálogo interno",
        help: "O objetivo é reconhecer o que passa pela mente, não provar se o pensamento está certo ou errado.",
        question: "Que pensamentos, frases ou cobranças aparecem?",
        why: "Escrever o pensamento tira dele parte do peso de verdade absoluta.",
        placeholder: "Registre as palavras que surgem, sem precisar concordar com elas.",
      },
    ] as const,
    unclear: "Ainda não consigo identificar",
    skip: "Prefiro não registrar agora",
    clear: "Limpar",
    prev: "Anterior",
    next: "Próxima dimensão",
    whyLabel: "Por que observar isso pode ajudar?",
  },

  regulate: {
    eyebrow: "Regular · aprendizagem",
    title: "Um recurso para conhecer hoje",
    description:
      "As práticas são apresentadas progressivamente, considerando o que você já conheceu, o tempo disponível e suas preferências — não a emoção escolhida na roda.",
    newBadge: "Recurso novo",
    knownBadge: "Você já conheceu",
    whyLabel: "Por que esta prática aparece agora?",
    practice: "Praticar agora",
    practiced: "Prática concluída",
    continue: "Continuar para agir",
    skip: "Continuar sem prática",
    another: "Conhecer outro recurso",
    utilityLabel: "Como este recurso foi para você?",
    utilityOptions: [
      { value: 1, label: "Não ajudou" },
      { value: 2, label: "Ajudou pouco" },
      { value: 4, label: "Ajudou" },
      { value: 5, label: "Ajudou bastante" },
    ] as const,
    autonomyTitle: "Autonomia se constrói aos poucos",
    autonomyDescription:
      "O aplicativo não precisa decidir qual respiração ou prática é “a correta” para cada emoção. Ele pode ajudar você a conhecer recursos e perceber, com o tempo, quais são mais úteis.",
    autonomyItems: [
      {
        title: "Uma prática por vez",
        description: "Menos opções quando a carga de decisão pode atrapalhar.",
      },
      {
        title: "Sem prescrição por emoção",
        description: "A escolha não parte de “ansiedade → técnica X”.",
      },
      {
        title: "Aprendizado pelo histórico",
        description:
          "Utilidade percebida, acessibilidade, tempo e preferência ajudam a construir repertório.",
      },
    ] as const,
  },

  act: {
    eyebrow: "Agir",
    title: "O que está ao seu alcance agora?",
    description:
      "Organizar a situação em três áreas evita uma divisão rígida entre “controlo” e “não controlo”. Muitas situações universitárias podem ser influenciadas, mas não controladas por uma única pessoa.",
    columns: [
      {
        key: "direct",
        title: "Depende de mim",
        description: "Ações que você pode iniciar, interromper ou escolher diretamente.",
        placeholder: "Ex.: separar os materiais e começar por 10 minutos",
      },
      {
        key: "influence",
        title: "Posso influenciar",
        description:
          "Você pode conversar, pedir, negociar ou buscar apoio, mas o resultado também depende de outras pessoas.",
        placeholder: "Ex.: conversar com o professor sobre uma dúvida",
      },
      {
        key: "none",
        title: "Não depende de mim",
        description: "Acontecimentos ou respostas que não estão sob seu controle direto.",
        placeholder: "Ex.: a decisão final de outra pessoa ou o clima",
      },
    ] as const,
    guiltQuestion: "Como pensar sobre controle sem se culpar?",
    guiltAnswer:
      "Reconhecer o que depende de você não significa assumir responsabilidade por tudo. A proposta é localizar onde existe alguma margem de escolha e onde pode ser necessário aceitar limites, buscar apoio ou aguardar.",
    stepTitle: "Meu menor próximo passo possível",
    stepNote:
      "Defina apenas se isso fizer sentido. Um registro sem ação imediata também pode ser válido.",
    stepPlaceholder: "Ex.: abrir o material e escolher a primeira tarefa",
    whenLabel: "Quando?",
    whenOptions: [
      { id: "now", label: "Agora" },
      { id: "today", label: "Hoje" },
      { id: "tomorrow", label: "Amanhã" },
      { id: "this_week", label: "Nesta semana" },
      { id: "no_deadline", label: "Sem prazo definido" },
    ] as const,
    statusOptions: [
      { id: "dont_know", label: "Ainda não sei" },
      { id: "not_now", label: "Não quero definir uma ação agora" },
      { id: "need_help", label: "Preciso de ajuda para pensar nisso" },
    ] as const,
    back: "Voltar",
    finish: "Concluir meu registro",
  },


  record: {
    eyebrow: "Seu registro de hoje",
    title: "Você transformou um momento em informação para se conhecer melhor",
    description:
      "O resumo abaixo organiza o que você percebeu, observou, praticou e escolheu fazer. Ele não interpreta sua experiência por você e não conclui melhora clínica a partir de um único exercício.",
    occurrenceNote:
      "Na Paisagem Emocional, cada emoção selecionada conta como uma ocorrência. Medições antes e depois da regulação permanecem vinculadas ao mesmo registro.",
    landscapeTitle: "Como este registro atualiza sua Paisagem Emocional",
    landscapeDescription:
      "O tamanho representa frequência nos check-ins. A profundidade da cor representa intensidade média no momento do registro.",
    legend: ["Tamanho = frequência", "Cor = intensidade", "Contorno = registro de hoje"],
    save: "Salvar na Minha Jornada",
    support: "Ver caminhos de apoio",
    again: "Fazer novo registro",
    openLandscape: "Abrir Paisagem Emocional completa",
  },

  support: {
    eyebrow: "Apoio disponível",
    title: "Você não precisa organizar tudo sozinho",
    description:
      "Esta tela usa os serviços e contatos definidos com cada instituição. Intensidade emocional alta, isoladamente, não é tratada como diagnóstico ou crise.",
    options: [
      {
        title: "Acolhimento institucional",
        description: "Canal da faculdade para escuta, orientação e encaminhamento.",
      },
      {
        title: "Rede de profissionais",
        description:
          "Psicologia, psiquiatria, psicopedagogia e outros serviços, conforme disponibilidade e contrato.",
      },
      {
        title: "Meu Plano de Apoio",
        description: "Organize necessidades, pessoas de referência e próximos passos.",
      },
      {
        title: "Ajuda imediata",
        description:
          "Em uma situação de risco imediato, procure os serviços de emergência da sua região ou uma pessoa de confiança.",
      },
    ] as const,
    close: "Entendi",
  },

} as const;
