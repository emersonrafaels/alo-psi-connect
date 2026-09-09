# Jornada Emocional V5 — nova experiência em Práticas

Substituir a jornada atual de `/praticas/jornada` pela experiência do site de referência (rodae.netlify.app), copiada fielmente, e somar melhorias de inteligência e usabilidade.

## O que muda para quem usa

Hoje a jornada é uma sequência de 8 passos com uma emoção só. Passa a ser uma experiência de 5 fases, mais próxima de como a pessoa realmente processa o que sente:

1. **Perceber** — a roda inteira fica sempre disponível, sem ordem obrigatória. Dá para registrar até 3 emoções, cada uma com sua intensidade, e buscar por palavra. Um painel lateral mostra o registro em construção.
2. **Pausa opcional de regulação** — se a intensidade estiver alta, aparece o convite a uma respiração breve de 1 minuto (com aviso de segurança e opção de pular ou salvar para depois). Depois vem uma nova medição de intensidade, que não conta como um segundo registro.
3. **Compreender** — escolha de um foco (ou "observar o momento como um conjunto") e quatro campos curtos: situação, corpo, comportamento e pensamentos. Sempre com saídas: "ainda não consigo identificar" e "prefiro não registrar agora".
4. **Regular** — um recurso para conhecer hoje, com explicação transparente de por que ele apareceu, opção de conhecer outro e avaliação de utilidade no fim.
5. **Agir** — três áreas (depende de mim / posso influenciar / não depende de mim), com texto de apoio contra autoculpa, mais o "menor próximo passo possível" e um prazo (agora, hoje, amanhã, esta semana, sem prazo).
6. **Registro** — resumo do que foi percebido, praticado e escolhido, sem interpretar nem diagnosticar, e a **Paisagem Emocional**: cada emoção como uma bolha em que o tamanho é a frequência e a cor a intensidade média, com contorno no registro de hoje.

Cabeçalho, subtítulo, textos explicativos, avisos e rótulos serão copiados do site de referência.

## Melhorias que vamos somar

- **Sugestão de recurso mais inteligente**: base é a trilha de aprendizagem (próximo recurso ainda não conhecido, que caiba no tempo disponível), ajustada pela intensidade registrada e pelo que já funcionou para a pessoa em sessões anteriores. O card sempre explica em uma frase por que aquele recurso apareceu.
- **Sinais reais da pessoa**: a jornada lê o diário emocional e as sessões anteriores para pré-sugerir emoções prováveis, mostrar "você registrou isto X vezes nos últimos 30 dias" e comparar a intensidade de hoje com a média recente.
- **Paisagem Emocional com dados reais** (não mock), alimentada pelas sessões salvas.
- **Continuar de onde parou**: se a pessoa sair no meio, a jornada retoma a sessão inaberta.
- **Alerta de cuidado**: intensidade máxima em emoções de risco aciona o caminho de apoio já existente na plataforma.
- **Acessibilidade e mobile**: navegação por teclado na roda, alvos maiores no celular, respeito a "reduzir movimento", nenhum texto cortado.
- **Ligação com o Buddy**: o registro concluído alimenta os insights do Buddy.

## Detalhes técnicos

**Banco** — `journey_sessions` hoje suporta apenas uma emoção por sessão. Migração:
- `journey_session_emotions` (session_id, emotion_id, family_id, level, intensity_before, intensity_after, is_focus, ordem) com GRANTs, RLS por `auth.uid()` e `service_role`.
- Colunas novas em `journey_sessions`: `phase`, `focus_mode`, `comprehension` (jsonb: situação/corpo/comportamento/pensamentos), `action` (jsonb: direct/influence/none/next/when/status), `immediate_regulation` (jsonb), `learning_practice` (jsonb com `selection_basis`), `completed_at`, `status`.
- RPC `journey_landscape(_user_id)` retornando frequência e intensidade média por emoção para a Paisagem.
- RPC `journey_next_resource(_user_id)` com o histórico de práticas já conhecidas (base da trilha).

**Frontend** em `src/features/jornada/`:
- `state/journeyReducer.ts` refeito para as 5 fases e lista de emoções (máx. 3); `sessionRepository.ts` passa a gravar no Supabase com fallback em sessionStorage para visitante.
- Novos componentes: `PerceiveSidebar`, `ImmediateRegulationCard`, `FocusSelection`, `ComprehensionDimensions`, `ControlColumns`, `NextStepForm`, `SessionSummary`, `EmotionLandscape`.
- `engine/recommend.ts` passa a expor `selectLearningResource()` — trilha + intensidade + histórico de utilidade — mantendo as regras atuais só como desempate; `selectionBasis` registrado na sessão.
- `hooks/useJourneySignals.ts` estendido para histórico de emoções, médias e práticas já conhecidas.
- `JourneyStepper` para 5 fases com subtítulo por fase; layout de duas colunas (conteúdo + painel lateral) igual à referência.
- Tokens de cor por família reaproveitados de `wheelColors.ts`; o painel de debug com o objeto JSON da sessão fica só fora de produção.

Validação com Playwright: fluxo completo das 5 fases, 3 emoções, pausa de regulação, gravação do registro e Paisagem, em desktop e mobile.
