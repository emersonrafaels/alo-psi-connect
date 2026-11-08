# Melhorias: Próximo encontro completo + Segurança e verificação

## 1. Próximo encontro completo (Meu espaço do aluno)
- Card do próximo encontro com nome, tipo (workshop/roda), data e hora.
- Contagem regressiva ("começa em 2h 15min"), atualizada a cada minuto.
- Botão **Entrar** liberado 15 minutos antes, quando houver link, na cor da instituição.
- Selo "Ao vivo" pulsante durante o encontro.
- Linha "Você tem N encontros nas próximas 24h", com lista curta.
- Botão "Adicionar à agenda" (.ics) já existente reaproveitado no card.
- Sem encontros inscritos: convite para ver a agenda de encontros (abre no topo).

## 2. Segurança e verificação
- Rodar a verificação de segurança rápida e a completa e listar os avisos (há cerca de 140 no banco).
- Corrigir primeiro os graves: tabelas sem regras de acesso, dados de alunos/pacientes legíveis por quem não deveria, funções expostas.
- Os avisos que não se aplicam ficam marcados com justificativa; nada é ocultado sem motivo.
- Testar com conta real os fluxos principais: entrar, Meu espaço, diário, pedido de apoio, mensagens, portal institucional (triagem e Comparador) e configuração de lembretes.
- Relatório final com o que passou, o que foi corrigido e o que depende de você.

## Detalhes técnicos
- Regras do encontro como funções puras em `student-home/pendingActions.ts` (janela de entrada 15 min, estado ao vivo pela duração), com testes.
- Dados lidos só de `group_session_registrations`/`group_sessions` do próprio aluno via RLS.
- Correções de segurança via migrações (políticas RLS, `search_path` em funções, revogar EXECUTE de funções internas), preservando os triggers de perfil e o anonimato `Aluno #N`.
- Testes em navegador com sessão gerada (`lovable auth-session`) para aluno e gestor institucional.
