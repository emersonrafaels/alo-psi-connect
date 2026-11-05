# Pedir apoio: confirmação com mensagem, email e aviso à instituição

## O que o aluno verá
- Ao clicar em "Pedir apoio" (Meu espaço e Biblioteca de Apoios), abre um modal de confirmação.
- Campo de texto opcional (até 1.000 caracteres) com botão de áudio, como nos outros campos.
- Templates prontos em chips, que preenchem o campo (editável):
  - "Estou me sentindo sobrecarregado(a) e gostaria de conversar."
  - "Tenho passado por dificuldades com ansiedade/estresse."
  - "Gostaria de orientação sobre atendimento psicológico."
  - "Estou com dificuldades nos estudos e isso tem me afetado."
  - "Prefiro explicar em uma conversa."
- Opção "Quero que a instituição saiba meu nome" (padrão: anônimo, mesmo comportamento das respostas de mensagem), com aviso de privacidade.
- Botões "Cancelar" e "Enviar pedido"; confirmação de sucesso igual à atual.

## O que acontece ao enviar
1. O pedido de cuidado continua sendo aberto como hoje (reaproveita pedido aberto nos últimos 30 dias, alimenta a Jornada de cuidado).
2. A mensagem do aluno fica guardada junto ao pedido.
3. Uma conversa aparece em **Mensagens** para os admins da instituição (assunto "Pedido de apoio"), com a mensagem do aluno; eles podem responder pela conversa já existente. Aluno aparece como `Aluno #N` se escolheu anonimato.
4. Email para os admins da instituição e para **noreply/contato da Rede Bem Estar** (ver pergunta abaixo), no padrão visual dos emails atuais, com link para o portal. Casos sintéticos/demo não disparam email.
5. No **Portal institucional**: novo card "Pedidos de apoio" na Visão geral (pedidos novos não atendidos, com mensagem e botão para abrir a conversa ou marcar como acolhido), e entrada nas ações prioritárias ("Responder N pedidos de apoio").

## Detalhes técnicos
- Migração: `care_requests` ganha `message text`, `identified boolean default false`, `thread_id uuid`; nova função `open_care_request(p_origin, p_message, p_identified)` mantendo a assinatura antiga compatível.
- Nova Edge Function `request-support`: valida JWT/entrada (zod), chama o RPC como o aluno, cria `messages`/`message_threads` do aluno para cada admin da instituição (reaproveitando regras de `send-message`), envia emails via Resend com `noreply@redebemestar.com.br`, pula `synthetic_student_cases`.
- Componente `SupportRequestDialog` usado em `StudentHome.tsx` e `BibliotecaApoios.tsx`; templates em arquivo puro com teste.
- Card do portal lê `care_requests` da instituição via RLS existente, respeitando anonimização `Aluno #N`.
- Registrar regra em AGENTS.md.

## Pergunta em aberto
Qual email da Rede Bem Estar recebe a cópia? Vou usar o email oficial de contato salvo na memória da marca, a menos que indique outro.
