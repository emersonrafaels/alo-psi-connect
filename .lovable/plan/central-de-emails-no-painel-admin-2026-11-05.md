# Central de Emails no painel admin

## O que o admin verá
Nova seção **Emails** no menu do painel admin, com a lista de todos os emails que o site envia (cerca de 22), agrupados por tema:

- **Conta e acesso:** confirmação de cadastro, link mágico, redefinição de senha, criação de perfil de paciente/profissional.
- **Agendamentos:** confirmação de consulta, cancelamento por falta de pagamento.
- **Encontros:** inscrição/aviso de encontro, sugestão de tema.
- **Instituições:** pedido de vínculo, revisão do pedido, lembrete de pedidos pendentes, ações da instituição, Radar enviado.
- **Cuidado e mensagens:** pedido de apoio, mensagens, lembretes diários.
- **Outros:** contato, newsletter, email de teste.

Para cada email, uma linha mostrando:
- Nome e descrição curta de quando é enviado.
- **Quem recebe** (ex.: aluno, profissional, admins da instituição).
- **Admin do site recebe?** (sim/não, com chave para ligar/desligar).
- **Emails admin extras** — campo para adicionar/remover endereços que recebem cópia daquele email específico.
- Chave para **desativar** o envio daquele email (com aviso para emails essenciais como senha e confirmação, que ficam sempre ativos).

Um campo no topo define o **email admin principal do site** (hoje redebemestar1@gmail.com).

## Como passa a funcionar
- Cada envio do site consulta essa configuração antes de enviar: adiciona o admin principal (se marcado) e os extras como cópia oculta.
- A cópia geral que já existe por tenant continua funcionando, somada às novas.
- Emails de alunos sintéticos/casos bloqueados continuam sem envio (regra atual mantida).

## Detalhes técnicos
- Tabela `email_settings` (chave do email, ativo, admin recebe, lista de extras); leitura/escrita só para admins, leitura pelo servidor.
- Catálogo fixo de emails (chave, nome, grupo, destinatário, essencial) em um arquivo compartilhado entre a tela e as funções.
- Helper `_shared/email-recipients.ts` usado por todas as funções de envio para montar cópias e respeitar a chave de desativar; substitui o email admin fixo no código.
- Página `/admin/emails` + item no menu lateral do admin.
- Testes para a regra de montagem de destinatários (admin ligado/desligado, extras, desativado, essencial).
- Reimplantar as funções de email alteradas.
