# Popular escalas, práticas e jornadas dos alunos Afya

## Situação atual
Os 2.806 alunos da Afya têm registros de Diário Emocional, mas nenhuma escala individual respondida, nenhuma prática realizada e nenhuma jornada emocional. Por isso a linha do tempo de "Ver Histórico" mostra só o diário. (As escalas do Comparador vêm de uma base agregada separada e não aparecem no histórico de cada aluno.)

## O que será criado (dados 100% sintéticos, sem notificações)
Cada aluno recebe uma história coerente com o próprio diário: quem tem humor mais estável pratica e responde mais e com resultados melhores; quem oscila tem altos e baixos; quem tem humor mais baixo mostra mais sinais de cuidado.

1. **Escalas** (últimos 90 dias): WHO-5, PSS-10, GAD-7, PHQ-9, ISI e MHC-SF, de 1 a 4 respostas por aluno conforme o engajamento, com pontuação e faixa de resultado coerentes com o diário.
2. **Práticas** (últimos 30 dias, com reforço nos últimos 7): de 0 a 8 práticas por aluno, usando as 6 práticas do catálogo, com durações realistas.
3. **Jornadas emocionais** (últimos 30 dias): de 0 a 4 jornadas concluídas por aluno, com emoções e intensidades que combinam com o humor do período.
4. Cerca de 15% dos alunos ficam sem atividade recente, para manter a participação realista.
5. Os estudos de caso A a F mantêm os dados que já têm e não são alterados.

## Resultado
Ao abrir "Ver Histórico" de um aluno da Afya, a linha do tempo mostrará Diário, Escalas, Práticas e Jornadas intercalados. Os indicadores do portal (ativos nos últimos 7 dias, engajamento) também passam a refletir essas atividades.

## Detalhes técnicos
- Inserção via SQL em lote com `setseed` determinístico por `user_id`, derivando o perfil do aluno da média de `mood_score` dos últimos 30 dias.
- Tabelas: `emotional_scale_responses` (`scale_id`, `scale_code`, `raw_score`, `normalized_score`, `severity`, `answers`), `praticas_checkouts` (`pratica_id`, `duracao_segundos`, `estado`), `journey_sessions` (`status='completed'`, `phase`, `emotion_id`, `intensity_before/after`, `completed_at`).
- Exclui usuários do registro de casos sintéticos A–F; nenhuma função de notificação é acionada. A operação pode ser repetida sem duplicar dados (marcada por `session_key`/`nota` com prefixo de demonstração).
- Validação: contagens por tabela e consulta da linha do tempo de um aluno de exemplo.
