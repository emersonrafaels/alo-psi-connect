# Buddy da instituição mais inteligente

## Problema observado
Hoje o Buddy recebe um resumo pronto, com contagens separadas: alunos por nível de risco e alunos por status de triagem. Ele não tem o cruzamento entre os dois e, por isso, não conseguiu responder "desses Em Risco, quantos precisam ser triados?". Além disso, contou o risco pelo último registro de triagem (94), enquanto a página de Triagem usa outra regra para "Para Triar" (cerca de 10). Por isso os números não batem com o que a equipe vê no portal.

## O que vai mudar
1. **Mesmos números do portal:** o Buddy passa a usar a mesma regra da Triagem para "Em Risco" e "Para Triar". Assim, o Buddy e a página de Triagem mostram sempre os mesmos números.
2. **O Buddy consulta os dados durante a conversa:** em vez de receber um único resumo, ele pode buscar o que precisar para cada pergunta, sempre com números gerais:
   - alunos por nível de risco cruzados com o status de triagem (para triar, em andamento, concluídos), além dos follow-ups vencidos;
   - os mesmos números por unidade e por curso, ocultando grupos com menos de 10 alunos;
   - médias do diário (humor, ansiedade, sono, energia) para 7, 15, 30 ou 90 dias, com comparação ao período anterior;
   - escalas (WHO-5, PSS-10, GAD-7, PHQ-9, ISI, MHC-SF) por coleta, unidade e curso;
   - sinais de palavras críticas, só com contagem e gravidade, nunca com o texto escrito pelos alunos.
3. **Modelo mais robusto:** o Buddy passa a raciocinar mais antes de responder, para fazer cruzamentos e comparações com mais precisão. A resposta pode demorar um pouco mais e custar um pouco mais por pergunta.
4. **Respostas melhores:** primeiro o número direto, depois o contexto (comparação com o período anterior, unidade ou curso de destaque) e, por fim, uma ação concreta com link para a tela certa (por exemplo, "Abrir Triagem → Para Triar").
5. **Indicador "Consultando dados…"** aparece no chat enquanto o Buddy busca as informações.

## O que continua igual
- Alunos nunca são identificados. Grupos com menos de 10 respondentes ficam ocultos.
- A conversa continua sem ser salva.

## Detalhes técnicos
- Edge function `buddy-institution-chat`: trocar o contexto em JSON por ferramentas de função do AI SDK, com `streamText` e `stopWhen: stepCountIs(5)`. Ferramentas: `triage_overview({groupBy?: none|unit|course})`, `diary_metrics({days})`, `scale_results({scale?, unit?, course?})` e `critical_signals({days})`. Todas usam o cliente com o JWT do usuário e as RPCs existentes, com poda de grupos n<10.
- Portar `isAwaitingTriage` e a lógica de risco atual de `src/features/triage/priorities.ts` para `supabase/functions/buddy-institution-chat/triageRules.ts`, com teste comparando com a versão do frontend, para os números serem idênticos.
- Manter `openai/gpt-6-astra` em `/v1/responses` e subir `reasoningEffort` de `low` para `high`. Manter `store: false`, o encrypted reasoning e o run-id.
- Esquemas estritos: raiz objeto, todos os campos obrigatórios e anuláveis, `additionalProperties: false`.
- Frontend `BuddyInstitutionChat.tsx`: passar a consumir o UI message stream para mostrar o estado da ferramenta ("Consultando dados…") e os links internos.
- Testar de ponta a ponta com a pergunta "Em Risco hoje?" seguida de "desses, quantos para triar?" e conferir com os números da Triagem.
