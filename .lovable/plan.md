# Corrigir email do pedido de apoio

## Causa (confirmada)
O pedido enviado hoje (18:43) criou a conversa para os admins, mas o email foi bloqueado: a regra bloqueia qualquer pedido de instituição demonstrativa (a Afya está marcada como demo). Como o aluno é uma conta real com login, o email deveria ter saído.

## Ajuste
- Na função do pedido de apoio, bloquear email apenas quando:
  - o pedido é de aluno sintético (sem login real), ou
  - o aluno é um caso de estudo com notificações bloqueadas.
- Alunos reais de instituições demo (ex.: casos Afya ativados) passam a enviar email para os admins da instituição e para a caixa da Rede Bem-Estar — mesma regra já usada nas mensagens.
- O email admin da Rede Bem-Estar (redebemestar1@gmail.com) recebe sempre uma cópia, mesmo quando a instituição não tem admins com email — hoje ele também foi bloqueado pela mesma regra.
- Registrar no log quantos emails saíram ou o erro do provedor, para facilitar diagnóstico.
- Reimplantar a função e testar a regra de bloqueio com um teste pequeno.

## Observação
Se o aluno já tiver um pedido aberto nos últimos 30 dias, o novo pedido reaproveita o anterior e não reenvia email. Para testar de novo, será preciso concluir/fechar o pedido atual ou eu removo o pedido de teste de hoje.
