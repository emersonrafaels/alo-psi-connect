# Ajustes no "Ver histórico" da Triagem

## O que foi encontrado
- **Texto "[DEMO-AFYA] Análise demonstrativa."**: vem das análises automáticas do diário. Cerca de 45 mil análises demonstrativas ainda têm essa marcação.
- **Números ao lado dos sentimentos** (ex.: Humor (22)): hoje são a **soma das notas** de cada registro (ex.: 5 registros de Estresse com nota 4 dão 20). Esse total não diz muito e confunde.
- **"IA: Saudável" em aluno Em Risco**: as análises demonstrativas antigas foram geradas sem levar em conta as notas reais. Por isso um registro com humor 1 e ansiedade 5 aparece como "Saudável".

## O que vai mudar
1. **Sem "[DEMO-AFYA]"**
   - Trocar a frase demonstrativa por mensagens neutras e coerentes com o nível de risco, em todas as análises demonstrativas (Afya e EBMSP).
   - Na tela, nunca mostrar textos que comecem com "[DEMO-".
2. **Sentimentos predominantes mais claros**
   - Mostrar a **média de 1 a 5** de cada sentimento, ex.: "Estresse · média 4,0 · 5 registros".
   - Ícone de ajuda explicando: "média das notas que o aluno deu a cada sentimento nos últimos 30 dias (1 = muito baixo, 5 = muito alto)". Ordenar pelos sentimentos mais intensos.
3. **Etiqueta de IA coerente**
   - Recalcular o nível das análises demonstrativas a partir das próprias notas do registro, usando a mesma regra de risco da triagem.
   - Proteção na tela: se a etiqueta da IA disser algo muito diferente das notas do registro, mostrar o nível calculado pelas notas.
4. **Novas abas "Práticas" e "Escalas"**
   - Ao lado de Diário Emocional e Histórico de Triagens.
   - Usam o mesmo histórico protegido dos últimos 90 dias que já existe em Alunos.
   - Práticas: nome, data e duração. Escalas: nome da escala (WHO-5, PHQ-9 etc.), data e faixa de resultado.
   - Nenhum texto pessoal é mostrado, e o aluno continua aparecendo só como "Aluno #N".

## Detalhes técnicos
- Atualização de dados em `mood_entry_analyses`: recalcular `risk_level` pelas notas para as linhas com `buddy_message ILIKE '[DEMO-%'`, e trocar `buddy_message` por um texto escolhido conforme o nível.
- Atualizar os geradores dos dados demonstrativos para que não voltem a criar a marcação nem níveis incoerentes.
- `useStudentActivityData.tsx`: `topEmotions` passa a guardar `{ average, entries }`.
- `StudentActivityModal.tsx`: esconder textos que começam com "[DEMO-", usar o nível calculado quando a IA divergir muito das notas, e criar as duas abas novas usando `get_institution_student_timeline` filtrado por tipo.
- Teste pequeno da regra que impede "Saudável" em um registro com humor 1 e ansiedade 5.
