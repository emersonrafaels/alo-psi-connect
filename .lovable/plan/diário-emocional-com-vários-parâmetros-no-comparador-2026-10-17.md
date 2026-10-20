# Diário emocional com vários parâmetros no Comparador

Na Análise Integrada, aba "Diário emocional", mostrar um card por parâmetro do diário (hoje só Humor, Energia e Tensão), cada um com média do grupo A, variação, mini gráfico e faixa de leitura — no mesmo formato dos cards atuais.

## Parâmetros
- Humor (1–5, maior é melhor)
- Energia (1–5, maior é melhor)
- Ansiedade (1–5, menor é melhor)
- Estresse/Tensão (1–5, menor é melhor)
- Qualidade do sono (1–5, maior é melhor)
- Horas de sono (média em horas, faixa ideal 7–9h)
- Bem-estar geral (composto: humor, energia, sono e ansiedade invertida)
- Dias com registro / adesão (% de alunos que registraram no período)

Ao clicar num card, o painel de detalhe abaixo (bandas, "O que os números dizem", mapa por curso, evolução) passa a usar aquele parâmetro, igual às escalas científicas. Comparações com grupos B, C… continuam funcionando.

## Privacidade
Somente médias agregadas; grupos com menos de 10 pessoas ficam ocultos.

## Detalhes técnicos
- Estender o RPC `get_institution_comparator` para retornar, por semestre/mês × unidade × curso, `avg_mood`, `avg_energy`, `avg_anxiety`, `avg_stress`, `avg_sleep_quality`, `avg_sleep_hours`, `avg_general` e `participants`, com supressão n<10 no servidor.
- Adicionar definições desses parâmetros (faixa, direção, bandas) em `scaleBands.ts`.
- Em `IntegratedAnalysis.tsx`, gerar os cards da aba Diário a partir dessa lista e reutilizar o painel de detalhe.
- Parâmetros sem dados na instituição mostram "Sem dados suficientes".
