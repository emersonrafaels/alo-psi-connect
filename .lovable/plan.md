# Comparador — página "Diário emocional" (réplica do desenho)

Ativar o item "Diário emocional" (hoje "Em breve") no menu do Comparador, com o mesmo seletor de Unidade e Semestre, botão de ampliar cada ficha e visual fiel ao desenho anexo. Textos livres do diário nunca aparecem.

## Seções (na ordem do desenho)
1. Cabeçalho "O ritmo emocional do semestre".
2. Quatro números: Pessoas que registraram (% dos elegíveis), Registros no semestre, Registros por pessoa (mediana), Ativos nas últimas 2 semanas.
3. Humor e sono, semana a semana: escolha Humor / Sono / Ambos e três visualizações (curva, colunas de desvio da média, mapa de calor). Clicar numa semana abre o painel "Semana selecionada" com valores e diferença para a média do semestre. Faixas "Semana de provas" e as duas frases de destaque calculadas a partir dos dados.
4. Como os registros se distribuem: barras empilhadas por unidade com a proporção de cada nível de humor (1 a 5).
5. Emoções mais registradas: % dos registros e variação em relação ao semestre anterior, separando difíceis e agradáveis.
6. O que está por trás: contextos marcados (Provas, Sono, Família, Estudos, Trabalho, Estágio, Plantão, Relacionamentos, Lazer) e frase sobre semanas de prova.
7. Humor por dia da semana, com frase sobre o dia mais difícil e o mais leve.

## De onde vêm os dados
- Humor, sono, contextos e dias: registros do diário dos alunos da instituição (a Afya já tem cerca de 47 mil registros, de junho a outubro de 2026).
- Semanas de provas: não existe calendário de provas cadastrado; serão marcadas automaticamente as semanas em que o contexto "Provas" aparece bem acima do normal.
- Emoções nomeadas (ansiedade, cansaço, calma...): o diário guarda só notas de humor, energia, ansiedade e estresse. Usarei as emoções escolhidas na Jornada Emocional (roda de emoções), que têm nomes. Se não houver registros suficientes, a ficha mostra "Ainda sem dados".
- Hoje há dados basicamente só de 2026.2; os semestres anteriores aparecem como "sem dados" e a variação vs 2026.1 fica oculta até existir base.

## Privacidade
Só totais e médias; grupos (unidade, semana, emoção) com menos de 10 pessoas ficam ocultos. Nenhum texto, áudio ou identidade sai do banco.

## Detalhes técnicos
- Nova função agregada `get_institution_diary_rhythm(institution)` (security definer, mesmo controle de acesso das outras páginas) retornando por semestre/unidade: KPIs, série semanal (humor, sono, % Provas), distribuição de humor, contextos, dia da semana e emoções da roda.
- UI em `src/features/institution/comparator/diary/` (`DiaryView.tsx` + regras puras `diaryLogic.ts` com testes: detecção de semana de prova, desvio da média, frases de destaque, dia mais difícil/leve).
- Registrar a decisão no AGENTS.md.
