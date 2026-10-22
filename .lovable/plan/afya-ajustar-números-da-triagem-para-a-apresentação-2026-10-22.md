# Afya: ajustar números da Triagem para a apresentação

## Situação atual
- **Triagens (1.400)**:
  - 176 concluídas (13%)
  - 312 em andamento (22%)
  - 912 triadas e aguardando (65%)
- **Risco (1.837 alunos com diário nos últimos 15 dias)**:
  - cerca de 575 Em Risco (31%)
  - 788 em Alerta (43%)
  - 658 em Atenção
  - poucos Estáveis

## Meta
1. **Triagens**:
   - 90% concluídas (cerca de 1.260)
   - 8% em andamento (cerca de 112)
   - 2% triadas e aguardando ou em prioridades (cerca de 28)
   - As concluídas recebem data de resolução e uma nota de desfecho neutra, por exemplo "Acompanhamento concluído com evolução estável".
   - Parte das em andamento fica com follow-up nos próximos dias e poucas vencidas, cerca de 3.
2. **Níveis de risco** (alunos com diário nos últimos 15 dias):
   - Em Risco: cerca de 3%
   - Alerta: cerca de 7%
   - Atenção: cerca de 25%
   - Estável: cerca de 65%

   Para isso, ajusto os valores de humor, ansiedade, energia e sono dos diários sintéticos recentes. Os alunos que ficam Em Risco ou em Alerta são escolhidos de forma estável, para a história fazer sentido com as triagens em andamento.
3. A fila "Para triar" fica com poucos alunos, coerente com os 2%.

## O que não muda
- Os estudos de caso A–F continuam como estão.
- Nenhum aviso ou e-mail é enviado.
- A instituição continua vendo os alunos como `Aluno #N`.
- As outras instituições não são alteradas.

## Detalhes técnicos
- Atualização de dados com SQL nas tabelas `student_triage` (status, resolved_at, resolution_notes, follow_up_date) e `mood_entries` (mood_score, anxiety_level, energy_level, sleep_quality nos últimos 15 dias).
- A escolha dos alunos é determinística por hash do `patient_id`.
- O filtro é a instituição Afya, excluindo os perfis de `synthetic_student_cases`.
- Antes de atualizar, confiro os nomes reais das colunas.
- Depois, refaço a contagem para confirmar as porcentagens.
