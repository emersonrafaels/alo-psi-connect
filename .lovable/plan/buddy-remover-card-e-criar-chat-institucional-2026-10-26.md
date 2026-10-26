# Buddy: remover card e criar chat institucional

## 1. Remover "Conheça nossos profissionais"
- Tirar esse card da lista de atalhos em `/buddy`.

## 2. Chat do Buddy para pessoas da instituição
- Para admins institucionais, o botão "Falar com o Buddy" abre uma nova página de chat (`/buddy/instituicao`). Alunos continuam indo para `/buddy` como hoje.
- O chat responde perguntas sobre os alunos da instituição da pessoa. Exemplos: "Quantos alunos estão Em Risco?", "Qual curso tem mais ansiedade?", "Quem precisa de follow-up?".
- Privacidade: os alunos aparecem sempre como `Aluno #N` e nunca com nome, e-mail ou texto do diário. Ficam de fora grupos com menos de 10 respondentes, como já acontece no Comparador.
- A conversa vale só para a sessão aberta e não é salva, para começar simples.
- A tela tem sugestões de perguntas, respostas que vão aparecendo enquanto são escritas e um aviso de privacidade.

## Detalhes técnicos
- Nova Edge Function `buddy-institution-chat`, com o modelo padrão `openai/gpt-6-astra` via Responses API e streaming. O JWT é verificado e a instituição do usuário é resolvida no servidor. A função recusa quem não for admin institucional.
- As ferramentas do modelo chamam só as RPCs agregadas que já existem: `get_institution_wellbeing_summary`, `get_institution_comparator`, `get_institution_critical_flags`, mais um resumo da triagem montado com a regra de `isAwaitingTriage`. O modelo nunca recebe nomes reais nem texto dos diários.
- Interface montada com os componentes AI Elements: Conversation, Message, PromptInput e Tool recolhido.
- Erros 402/429/403 aparecem com a mensagem retornada pela função.
