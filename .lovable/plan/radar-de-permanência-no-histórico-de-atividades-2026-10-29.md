# Radar de Permanência no "Histórico de atividades"

O modal da página Alunos (Histórico de atividades · Aluno #N) ganha um filtro **Radar (N)** depois de "Encontros", e as respostas do radar entram na lista "Todas" em ordem de data.

## Como aparece
- Card "Radar de Permanência" com a data, a tag "Radar" e o detalhe "Semestre 2026.2 · 34 perguntas respondidas" (marca "Atualização" quando o aluno respondeu de novo).
- Só aparecem a participação e a data. O conteúdo das respostas continua confidencial, igual à aba Radar do outro modal.
- O período segue os mesmos últimos 90 dias do modal.

## Detalhes técnicos
- Em `StudentTimelineModal.tsx`: novo tipo `permanence` em `KIND_META` (ícone Radar), consulta paralela à RPC já existente `get_student_permanence_participation` (mesma usada em `StudentActivityModal`), convertendo cada linha em `TimelineItem` e unindo à timeline, com filtro de 90 dias.
- Sem mudanças no banco.
