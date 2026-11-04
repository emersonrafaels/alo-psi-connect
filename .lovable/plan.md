# "Meu espaço" para profissionais

A mesma página central `/meu-espaco`, com uma versão própria quando quem entra é um profissional cadastrado (psicólogo, psiquiatra etc.). Alunos continuam vendo a versão atual; gestores de instituição seguem indo ao Portal Institucional.

## Menu e login
- "Meu espaço" passa a aparecer também no menu de profissionais (acima de "Área Profissional").
- Após o login, profissionais também vão para "Meu espaço".

## Seções da versão profissional
1. **Cabeçalho** – data, nome, profissão e registro (CRP/CRM), selo "Perfil ativo" ou "Perfil inativo".
2. **O que fazer agora** (até 5, por prioridade):
   - Perfil incompleto: falta foto, resumo, preço, tempo de consulta ou formação.
   - Dados de recebimento (PIX/banco) não preenchidos.
   - Nenhum horário de atendimento cadastrado.
   - Consulta hoje ou nas próximas 24 h (com link da chamada, quando houver).
   - Consulta com pagamento pendente.
   - Encontro que conduz nas próximas 24 h.
   - Mensagens não lidas.
3. **Meus indicadores** – consultas nos próximos 7 dias, consultas realizadas nos últimos 30 dias (vs. 30 anteriores), faturamento estimado no mês (consultas pagas), encontros conduzidos e participantes inscritos.
4. **Agenda** – próximas consultas (data, horário, situação do pagamento) e próximos encontros conduzidos; folgas/indisponibilidades cadastradas.
5. **Meu perfil público** – percentual de preenchimento, com atalho para editar e para ver como os pacientes veem.
6. **Instituições vinculadas** – lista das instituições parceiras ativas.
7. **Novidades e atalhos** – mensagens, posts recentes do blog; atalhos para Área Profissional, Agenda, Encontros e Perfil.

## Tour lightbox
- Tour próprio de 5 etapas para profissionais (boas-vindas, O que fazer agora, Indicadores, Agenda, Perfil/atalhos), aberto no primeiro acesso e reiniciável por "Ver tour".

## Privacidade
- O profissional vê apenas as próprias consultas e encontros; nada de diários, escalas ou Radar dos pacientes.

## Detalhes técnicos
- `StudentHome.tsx` decide a versão pelo `tipo_usuario`/`useUserType`; nova `src/features/professional-home/ProfessionalHome.tsx`.
- Regras puras em `src/features/professional-home/professionalActions.ts` (completude do perfil, pendências, indicadores) com testes Vitest.
- Dados por consultas já protegidas por RLS: `profissionais` (pelo `user_id`), `agendamentos` (pelo `professional_id`), `profissionais_sessoes`, `professional_unavailability`, `group_sessions` (`professional_id`/`created_by`) + `group_session_registrations` (contagem), `professional_institutions`, `list_my_message_threads`, `blog_posts`. Antes de implementar, confirmar que o profissional consegue ler os próprios agendamentos via RLS; se não, criar uma função de leitura restrita aos próprios atendimentos.
- Atualizar a regra do "Meu espaço" no `AGENTS.md`.
