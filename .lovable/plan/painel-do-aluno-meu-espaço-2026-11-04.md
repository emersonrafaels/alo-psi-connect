# Painel do Aluno ("Meu espaço")

Uma página central para o aluno, equivalente ao Portal Institucional, reunindo indicadores, pendências, histórico recente e novidades, com tour de boas-vindas em lightbox.

## Onde fica
- Nova página `/meu-espaco` (e `/medcos/meu-espaco`), só para alunos (perfil paciente sem papel institucional; gestores são levados ao Portal Institucional).
- Primeiro item do menu do usuário: "Meu espaço".
- Após o login, o aluno passa a cair nesta página.

## Seções da página
1. **Cabeçalho** – data, instituição vinculada e frase do Buddy do dia.
2. **O que fazer agora** (pendências priorizadas, até 5), por exemplo:
   - Diário emocional não preenchido hoje / há X dias.
   - Escala pendente ou vencida (WHO-5, PSS-10, GAD-7, PHQ-9 – conforme periodicidade).
   - Radar de Permanência do semestre atual ainda não respondido (ou desatualizado).
   - Encontro inscrito nas próximas 24h (botão para entrar).
   - Mensagem não lida da instituição.
   - Agendamento próximo ou com pagamento pendente.
3. **Meus indicadores** – cards com média de humor, sono e estresse dos últimos 7 dias, variação em relação à semana anterior e mini gráfico; dias seguidos de diário.
4. **Últimos preenchimentos** – lista com "última vez" de cada atividade: Diário, Jornada Emocional, Práticas, Escalas, Radar, Encontros; cada linha com botão "Preencher/Ver".
5. **Próximos compromissos** – encontros inscritos e consultas agendadas.
6. **Novidades** – mensagens recentes da instituição, novos apoios publicados, novos encontros e posts recentes do blog.
7. **Atalhos** – Buddy, Biblioteca de Apoios, Práticas, Minhas emoções.

## Tour lightbox
- Abre automaticamente no primeiro acesso (uma vez), reiniciável por um botão "Ver tour" no topo.
- 5 etapas no mesmo estilo dinâmico do tour institucional: boas-vindas e privacidade, O que fazer agora, Indicadores, Últimos preenchimentos, Novidades e atalhos — com progresso clicável e destaque da seção.

## Privacidade
- Tudo é lido apenas com os dados do próprio aluno; nenhuma informação nova é exposta à instituição.

## Detalhes técnicos
- `src/pages/StudentHome.tsx` + `src/features/student-home/` com componentes por seção.
- Regras de pendências como funções puras em `src/features/student-home/pendingActions.ts` (prioridade, prazos de escalas, semestre do Radar), com testes Vitest.
- Hook `useStudentHome` agregando consultas já protegidas por RLS: `mood_entries`, `journey_sessions`, `praticas_checkouts`, `emotional_scale_responses`, `permanence_responses`, `group_session_registrations`, `agendamentos`, `message_threads` (via `list_my_message_threads`), `support_catalog`, `group_sessions`, `blog_posts`. Sem novas tabelas.
- Tour reutilizando `src/components/ui/tour-overlay.tsx`, com flag em localStorage por usuário.
- Redirecionamento pós-login em `AuthCallback`/`Auth` para alunos; item no menu do usuário.
- Registrar a decisão em `AGENTS.md`.
