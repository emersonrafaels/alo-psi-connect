# Nova instituição AeroTD reaproveitando os dados da Carta Consulta

## Validação dos dados da Carta Consulta (confirmado no banco agora)

A Carta Consulta (`a695135f-…fde`) tem hoje:

- 10 alunos vinculados, todos com retrato do Buddy (1 cada) e 1 insight do Buddy cada
- Diários emocionais preenchidos: 9 alunos com 50 registros cada e Boris Johnson com 3 — último registro em 05/08/2026
- 111 análises de IA de diário (risco/mensagem do Buddy) associadas a esses diários
- 5 profissionais vinculados (2 employee, 3 partner), todos ativos
- 3 usuários administradores da instituição, os mesmos 3 também como visualizadores do Buddy
- 10 alunos liberados no painel "Buddy dos Alunos" e 1 triagem registrada

Ou seja: sim, os alunos da Carta Consulta já têm diários emocionais e dados do Buddy. Apenas escalas emocionais praticamente não existem (só Boris Johnson tem 18 respostas).

## O que será feito

Criar a instituição **AeroTD** e **vincular os mesmos registros** (não duplicar alunos nem profissionais). Como os diários, retratos e insights do Buddy pertencem ao aluno — e não ao vínculo institucional — todo o histórico aparece automaticamente no portal da AeroTD.

1. Criar `AeroTD` em instituições de ensino: tipo privada, ativa, com parceria e com as permissões de gerenciar usuários, cupons e profissionais habilitadas (igual à Carta Consulta).
2. Vincular os mesmos 10 alunos à AeroTD (mantendo também o vínculo com a Carta Consulta).
3. Vincular os mesmos 5 profissionais, preservando o tipo de relação (employee/partner) e status ativo.
4. Liberar os mesmos 10 alunos no painel "Buddy dos Alunos" da AeroTD.
5. Não replicar os administradores da Carta Consulta: a AeroTD ficará sem usuários administradores nesta etapa, para que novos admins sejam criados depois (pelo Admin > Instituições ou em um passo seguinte, informando nome/e-mail).

## Detalhes técnicos

- Uma única migração SQL com `INSERT ... SELECT` a partir dos vínculos da Carta Consulta, usando `ON CONFLICT DO NOTHING` para ser idempotente.
- Tabelas envolvidas: `educational_institutions`, `patient_institutions`, `professional_institutions`, `institution_buddy_students` (sem escrita em `institution_users` / `institution_buddy_viewers`).
- Nenhuma alteração de código de frontend é necessária: o portal institucional, o dashboard de bem-estar, a triagem e o Buddy dos Alunos já filtram por `institution_id`.
- A triagem existente continua ligada à Carta Consulta (não será copiada, para não duplicar histórico clínico); o painel de triagem da AeroTD começará vazio.
