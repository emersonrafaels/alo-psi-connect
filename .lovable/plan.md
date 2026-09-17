# Ajustar risco e fila de triagem da EBMSP

## Situação atual (verificada)

- 100 alunos vinculados à EBMSP, todos com registros no diário dos últimos 45 dias.
- Pela classificação automática do painel (média de 15 dias), hoje aparecem **25 críticos** e **16 em alerta** — 41 alunos em risco.
- Todos os 100 alunos já possuem uma triagem registrada (40 resolvidas, 39 em andamento, 20 triadas, 1 resolvida de alto risco). Por isso **nenhum aluno aparece como "aguardando triagem"**.

## O que será ajustado

### 1. Total em risco em torno de 35

Recalibrar os dados demonstrativos do diário dos alunos da EBMSP para que a classificação automática resulte em, aproximadamente:

- **12 alunos críticos**
- **23 alunos em alerta**
- os demais distribuídos entre atenção e estável, sem ninguém sem dados

O ajuste é feito suavizando humor, ansiedade, energia e sono dos alunos que hoje ficam em risco além da cota, mantendo a variação natural dia a dia (nada de valores uniformes) e preservando os históricos usados nas comparações de 15 e 30 dias.

### 2. Cerca de 15 alunos aguardando triagem

- Escolher 15 alunos já classificados em risco (mistura de críticos e alertas) e **remover a triagem demonstrativa** deles, para que apareçam na fila como classificados e ainda não triados.
- Os demais alunos em risco continuam com triagem em andamento, triada ou resolvida, mantendo o painel com casos em todas as etapas.

### 3. Coerência entre painéis

- Ajustar as análises do Buddy vinculadas aos dias alterados para que o nível de risco exibido no aluno acompanhe os novos valores do diário.
- Nenhum aluno, profissional, encontro, prática ou cupom será criado ou removido.

## Detalhes técnicos

- Alteração apenas de dados, restrita à instituição `09301ab9-4687-4920-8daf-0cbb9c9280e8` e aos registros marcados como demonstrativos; nenhuma mudança de estrutura, permissão ou código de aplicação.
- Classificação de referência (`calculateRiskLevel` em `src/hooks/useStudentTriage.tsx`): crítico com humor médio ≤ 1,5, ansiedade ≥ 4,5 ou queda de humor > 40%; alerta com humor ≤ 2,5, ansiedade ≥ 3,5 ou energia ≤ 1,5.
- Recalibração em `mood_entries` (humor, ansiedade, energia, sono) por aluno excedente, com deslocamento determinístico por aluno e por dia para evitar séries planas e queda artificial de tendência.
- Sincronizar `mood_entry_analyses.risk_level` (`healthy | attention | alert | critical`) dos registros afetados.
- Remover as linhas de `student_triage` marcadas como demonstrativas dos 15 alunos escolhidos (o painel considera "aguardando triagem" quem não tem triagem ou está em `pending`).

## Validação

- Recontar, com a mesma regra do painel e janela de 15 dias: críticos ≈ 12, alerta ≈ 23, total em risco ≈ 35.
- Confirmar 15 alunos em risco sem triagem e o restante distribuído entre em andamento, triada e resolvida.
- Abrir a Triagem do portal da EBMSP e verificar a fila, os indicadores de risco e o Buddy sem erros.
- Confirmar que Carta Consulta, AeroTD e demais instituições não foram alteradas.
