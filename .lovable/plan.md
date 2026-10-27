# Sistema de mensagens

## O que o usuário vai ver
- **Sininho com contador** no topo do site para todo usuário logado, e página **/mensagens** com caixa de entrada, conversas e resposta.
- **Nova mensagem** (admin da Rede Bem-Estar), com destinatários:
  - Todos os usuários
  - Todas as instituições (admins institucionais), ou instituições escolhidas
  - Usuários específicos (busca por nome/e-mail)
- **Nova mensagem** (admin institucional, no menu lateral do portal: "Mensagens"), apenas para alunos da própria instituição:
  - Todos os alunos
  - Por Unidade > Curso > Turno > Turma (pode combinar vários)
  - Alunos específicos
  - Antes de enviar, mostra "Esta mensagem chegará a N alunos".
- **Respostas**: quem recebe pode responder; a conversa fica entre o aluno e quem enviou (comunicado em massa vira conversas individuais, nunca expõe um aluno aos outros).
- **E-mail**: opção "Também enviar por e-mail" ao criar; envio a partir de noreply@redebemestar.com.br com link para a conversa no site.

## Privacidade (nome real conforme contexto)
- Listas, buscas e escolhas de destinatários no portal continuam como **Aluno #N**.
- Dentro de uma conversa em que o **próprio aluno respondeu**, a instituição passa a ver o nome que ele usa no perfil (ele se identificou ao responder).
- Alunos sintéticos/demonstrativos (Afya, casos A–F) nunca recebem e-mail.

## Detalhes técnicos
- Tabelas novas (com GRANTs + RLS): `messages` (comunicado: autor, tipo de público, filtros, institution_id, envio por e-mail), `message_threads` (uma por destinatário: message_id, recipient_id, sender_id, last_activity, read flags), `message_replies` (thread_id, author_id, body).
- RLS: destinatário e remetente veem apenas suas threads; admin institucional só cria para pacientes da sua instituição (`user_belongs_to_institution` / placements); envio "todos/instituições" só com `is_admin`.
- Edge function `send-message`: valida papel e público, resolve destinatários no servidor (hierarquia via `patient_institution_placements`, paginando além de 1.000), cria threads em lote, e envia e-mails via Resend respeitando o registro de casos sintéticos.
- Contador de não lidas via Realtime com cleanup em `useEffect`.
- Frontend: `src/features/messaging/` (hooks, composer, seletor de público, inbox, thread), item no `PortalSidebar.tsx`, sininho no `header.tsx`, rotas `/mensagens` e `/portal-institucional/mensagens`.
- Testes para a regra de quem pode enviar para quem e resolução de público por hierarquia.
