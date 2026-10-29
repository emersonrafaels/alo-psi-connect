# Ajustes no Comparador

## 1. Atendimentos
- Trocar "mediana"/"Mediana" por "média"/"Média" em todos os rótulos (KPI de espera, seletor da comparação de unidades, legendas).
- Trocar "Horas à noite" / "horas à noite" / "ofertadas à noite" por "a noite" (sem acento).

## 2. Diário emocional — gráfico em colunas
- As colunas hoje passam das bordas de cima e de baixo (semanas 8, 15, 16, 17).
- Ajustar a escala para que a maior variação do semestre ocupe no máximo a altura disponível, com uma pequena margem. Nenhuma coluna sai do quadro.

## 3. Conteúdos e práticas — "Quando cada tema é procurado"
- Mostrar a intensidade por mês em vez de por semana: 12 colunas (Jan a Dez), somando os acessos de cada mês.
- Texto do subtítulo e da dica de cada célula passam a falar em "mês".
- "Pico do tema": destacar com um anel rosa forte (mesmo rosa na legenda).
- O cabeçalho cinza de "semana de provas" passa a marcar os meses que têm semanas de prova.

## 4. Botão "Ver agenda de encontros"
- Ao abrir a página de Encontros a partir desse botão, ela abre já no topo.

## Detalhes técnicos
- `appointments/AppointmentsView.tsx`: só textos.
- `diary/DiaryView.tsx`: substituir o fator fixo `* 230` por `130 * 0.92 / maxAbsDesvio` (meia altura de 260px).
- `contents/ContentsView.tsx`: agregar `t.series` (semanal) em 12 meses a partir da data de início de cada semana; `normToPeak` sobre o array mensal; anel `ring-pink-500` via token semântico novo (`--highlight-pink`) em `index.css`.
- Encontros: chamar `window.scrollTo(0, 0)` ao clicar no link e no carregamento de `GroupSessions.tsx`.
