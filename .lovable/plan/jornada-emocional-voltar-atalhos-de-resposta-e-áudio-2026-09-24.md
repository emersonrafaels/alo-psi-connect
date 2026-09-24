# Jornada Emocional: voltar, atalhos de resposta e áudio

## 1. Voltar a etapas anteriores
- Etapas já concluídas no indicador superior (Perceber, Compreender...) ficam clicáveis e levam de volta a elas, mantendo o que já foi preenchido. Etapas futuras continuam bloqueadas.
- Botão "Voltar" no rodapé de cada etapa, como no protótipo: "Voltar à roda" (Compreender), "Voltar" (Regular → Compreender, Agir → Regular), "Voltar à prática" na comparação do corpo.
- Nas dimensões de Compreender, o botão voltar leva à dimensão anterior antes de sair da etapa.

## 2. Atalhos em Compreender
- "Ainda não consigo identificar" e "Prefiro não registrar agora" passam a escrever o texto ("Ainda não consigo identificar." / "Prefiro não registrar agora.") dentro da caixa, que continua editável, e destacam o botão escolhido — igual à imagem 2.
- "Limpar" apaga a caixa e remove o destaque. "Prefiro não registrar" não pula mais a dimensão automaticamente.

## 3. Áudios iguais à referência
- Todos os botões "Ouvir" (topo da etapa e orientações) passam a usar a mesma leitura do protótipo: voz em português do Brasil escolhida automaticamente, velocidade 0,96, e leitura do conteúdo visível da etapa (pergunta, títulos e textos, até ~900 caracteres) em vez de só título + frase curta.
- Botão alterna "Ouvir esta etapa" / "Parar leitura"; iniciar outro áudio para o anterior; o áudio para ao trocar de etapa; aviso se o navegador não suportar.

## Detalhes técnicos
- `PhaseStepper.tsx`: `onSelect` para fases com índice < atual; nova ação `GO_TO_PHASE` no `reducer.ts`.
- `ComprehensionDimensions.tsx`: botões chamam `onChange(key, texto)` e marcam estado especial; `unclear` deixa de desabilitar a textarea.
- Novo `src/features/jornada/v5/lib/speech.ts` (speak/cancel, seleção de voz via `getVoices` + `voiceschanged`, rate .96); `JourneyGuide.tsx` e o card "Ouvir a etapa" usam-no, lendo `h2,h3,p` do contêiner da etapa via ref.
- Validação Playwright desktop e celular: voltar entre etapas, atalhos preenchendo a caixa, botões de áudio sem erros.
