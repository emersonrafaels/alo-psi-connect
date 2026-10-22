# Popular a linha do tempo em "Ver Histórico" (Portal Institucional → Alunos)

## Problema
O modal "Histórico de Uso" hoje só monta a linha do tempo com consultas e cupons. Para alunos (inclusive os sintéticos da Afya), quase não há esses eventos, então a linha do tempo aparece vazia. Além disso, a página envia o nome anonimizado ("Aluno #N"), que nunca casa com a busca por nome do paciente.

## O que será feito
1. A linha do tempo passa a reunir, em ordem cronológica (mais recentes primeiro), as atividades do aluno nos últimos 90 dias:
   - Registros do Diário Emocional (humor do dia e risco da Análise Bem Estar, sem textos pessoais)
   - Jornadas Emocionais concluídas (emoções principais)
   - Práticas realizadas (nome e duração)
   - Escalas respondidas (nome da escala e faixa interpretativa)
   - Encontros em grupo inscritos/participados
   - Consultas e cupons (como já existe)
2. Cada tipo ganha ícone e cor próprios, com filtro rápido por tipo no topo e "Carregar mais" após 30 itens.
3. O nome exibido continua sempre "Aluno #N"; a busca usa os identificadores internos, nunca o nome.
4. Estado vazio claro: "Nenhuma atividade registrada nos últimos 90 dias".

## Privacidade
Somente metadados (data, tipo, nota/faixa). Nenhum texto livre do diário, jornada ou transcrição aparece para a instituição.

## Detalhes técnicos
- Estender `useUserStorytellingData` com consultas por `profile_id`/`user_id` em `mood_entries` (+ `mood_entry_analyses`), `journey_sessions`/`journey_session_emotions`, `praticas_checkouts`, `emotional_scale_responses`, `group_session_registrations`; novos tipos de evento no union `type`.
- Em `InstitutionStudents.tsx`, parar de usar o nome anonimizado como filtro (`patientName` só para exibição).
- Primeiro passo: verificar se as policies RLS permitem ao admin institucional ler essas tabelas para alunos vinculados; onde não permitirem, criar uma RPC `get_institution_student_timeline(institution_id, patient_id)` SECURITY DEFINER que valida vínculo e retorna apenas os metadados acima.
- Validar com um aluno Afya (ex.: caso A) que a linha do tempo mostra itens dos últimos 7 dias.
