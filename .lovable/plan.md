# Aluno escolhe se responde anonimamente

## O que muda para o aluno
- Na caixa de resposta de uma conversa vinda da instituição, aparece a opção **"Responder anonimamente"** (marcada por padrão).
- Marcada: a instituição continua vendo só "Aluno".
- Desmarcada: a instituição passa a ver o nome do aluno nessa conversa.
- Logo acima, um aviso: *"Mesmo que você mostre seu nome, a instituição não saberá quais dados do diário, escalas ou práticas são seus. Esses dados continuam aparecendo apenas de forma anônima."*
- A opção só aparece em conversas com instituição; mensagens da Rede Bem-Estar seguem como hoje.
- Depois que o aluno se identificar uma vez na conversa, o nome fica visível nela (aviso indica isso).

## Detalhes técnicos
- Migração: coluna `is_anonymous boolean default true` em `message_replies`; coluna `recipient_identified boolean default false` em `message_threads`.
- Trigger `on_message_reply`: marca `recipient_identified = true` só quando o destinatário responde com `is_anonymous = false` (mantém `recipient_replied` para não lidas).
- `list_my_message_threads`: revela o nome do aluno para a instituição com base em `recipient_identified` em vez de `recipient_replied`. Conversas antigas já respondidas ficam anônimas.
- Garantir que a leitura das respostas no lado institucional não exponha o nome do autor em respostas anônimas.
- `useSendReply` envia `is_anonymous`; `Inbox.tsx` ganha checkbox + infobox.
- Atualizar a regra no `AGENTS.md`.
