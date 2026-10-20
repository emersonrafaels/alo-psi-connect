# Análise Integrada — alinhar à referência (Campus Vivo V13)

## Comparação: referência x página atual

| Bloco da referência | Hoje na Rede Bem-Estar | Ação |
|---|---|---|
| Filtros: Recorte A (Unidade > Curso > Turno > Turma), total de estudantes/respondentes, "Limpar" | Só seletores de recorte A/B (unidade ou curso) | Criar painel de Filtros em cascata |
| "Comparar com" B: Sem comparação, Outra unidade, Outro curso, Outro turno, Outra turma, Personalizado | Recorte B obrigatório | Chips de modo de comparação, "Sem comparação" padrão |
| Coleta semestral em abas (2025.2 / 2026.1 / 2026.2 com mês) + próxima coleta | Filtro de semestre no cabeçalho | Seletor segmentado dentro dos Filtros |
| Abas Escalas científicas / Diário emocional / Participação | Não existe | Criar as três abas |
| Cards de instrumento (média, variação, sparkline, faixa) clicáveis | Botões simples de escala | Grade de cards; card ativo destacado |
| Detalhe do instrumento: descrição, faixa, régua de faixas (Muito baixo/Baixo/Adequado/Alto) com marcadores A e Rede | Não existe | Novo bloco "Como interpretar os valores" |
| "O que os números dizem": frase em linguagem simples, régua Pior–Melhor, cards Tamanho da diferença / Tendência / Confiança | Não existe | Novo bloco de resumo |
| Mapa por curso: pontos por unidade numa linha (dumbbell), visualizar por Cursos/Turnos/Turmas, coluna de diferença | Tabela "Todos os instrumentos" | Substituir pelo mapa em pontos; clique no ponto define o grupo A |
| Card do grupo A: média, faixa, variação, respondentes, cobertura, vs rede, histograma de respostas | Não existe | Novo card de detalhe |
| "Como evoluiu ao longo das coletas?" com abas Evolução / Distribuição / Cobertura e "Ver em tabela"; semestre ativo destacado | Gráfico de área A x B x Rede | Refazer gráfico como linha com valores nos pontos e as 3 abas |
| Rodapé: grupos com menos de 10 não aparecem | Parcial | Manter aviso |
| Bloco "Escalas x Diário por unidade" | Existe, não está na referência | Passa para a aba Diário emocional |

Fora do escopo agora: "Registrar investigação sobre este grupo" e o seletor "Visualizar como" aparecem como desativados ("Em breve"), porque ainda não existe esse fluxo.

## Dados e privacidade
- Todos os números continuam vindo só do resumo agregado da instituição. Grupos com menos de 10 respondentes ficam ocultos.
- Primeiro passo: conferir se o resumo agregado já traz turno, turma e a distribuição das respostas. Se faltar algo, ampliar o resumo agregado mantendo a regra de n≥10. Se não for possível, Turnos/Turmas aparecem desativados.
- O IQoL continua zerado e marcado como indisponível.

## Detalhes técnicos
- Dividir a aba em componentes dentro de `src/features/institution/comparator/` (Filters, InstrumentCards, ScaleBands, NumbersSay, CourseDotMap, GroupDetail, EvolutionChart), para que `InstitutionComparator.tsx` fique enxuto.
- As faixas de interpretação de cada escala ficam num catálogo único, com os pontos de corte (por exemplo, WHO-5: 0–28, 29–50, 51–75, 76–100).
- Estado: `filters {unit, course, shift, class}`, `compareMode`, `semester`, `scale`, `tab`; o clique no mapa atualiza `filters`.
- Usar recharts e as cores semânticas do projeto; registrar a nova pasta no AGENTS.md.
