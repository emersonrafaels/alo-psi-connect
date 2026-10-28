# Comparador — nova Visão geral (redesenho)

Substituir por completo a Visão geral de `/portal-institucional/comparador` pelo desenho do arquivo enviado, usando os dados reais da instituição. A Análise integrada continua igual.

## O que muda na tela

1. **Menu lateral do comparador**: nome da instituição, itens "Visão geral" e "Análise integrada" funcionando. NED Nacional, Jornada de cuidado, Atendimentos, Diário emocional, Conteúdos e práticas e Ações e acompanhamento aparecem com a etiqueta "Em breve" e não abrem nada. Embaixo ficam o aviso "Leitura protegida" e "Voltar ao Portal Institucional".
2. **Topo**: caminho "Comparador / Visão geral", seletor de unidade e botões para escolher a coleta semestral.
3. **Bloco de abertura**: "Como estão os seus estudantes neste semestre", com até três frases "O que mudou desde a coleta anterior" geradas a partir dos números reais (variação do WHO-5 e da faixa, unidade acima ou abaixo da média, cobertura).
4. **Quatro números**: estudantes no recorte, responderam ao menos 1 escala, usaram o Diário, pediram apoio (com barra de proporção e uma observação).
5. **Escalas científicas**: tabela com média, posição nas faixas coloridas, variação e minigráfico das 3 últimas coletas; "Aguardando respostas" quando não houver dados; link "Comparar recortes" para a Análise integrada.
6. **Cada unidade frente à média**: botões por escala, destaque por unidade, barras por curso mostrando melhor ou pior que a média, notas e legenda.
7. **Perfil das unidades nas 6 escalas**: gráfico de radar com a distância de cada unidade à instituição, em %, com escalas de sintomas invertidas.
8. **Quem chega à leitura**: funil de participação (elegíveis, ativaram acesso, diário, ao menos 1 escala, WHO-5, pediram apoio).
9. **Continue a leitura**: atalhos para as outras leituras.
10. **Ampliar ficha**: cada bloco tem um botão para abrir em tela ampliada sobre o fundo escurecido.

Cores, fontes, espaçamentos e cantos seguem os valores do desenho, aplicados com as cores do tema do portal. Grupos com menos de 10 pessoas continuam ocultos e nenhum dado individual aparece.

## Detalhes técnicos

- Novos componentes em `src/features/institution/comparator/overview/` (Sidebar, Hero, KpiStrip, ScalesTable, UnitVsMean, UnitRadar, ParticipationFunnel, ContinueReading, FullscreenCard). `InstitutionComparator.tsx` só monta a visualização.
- Dados vêm só do RPC `get_institution_comparator`; faixas reaproveitadas de `scaleBands.ts`. Se o RPC não trouxer "ativaram acesso" ou "pediram apoio" agregados, ampliar o RPC com essas contagens (sempre agregadas, com corte n<10); caso contrário, mostrar "sem dados".
- Frases de "O que mudou" e cálculos de distância/radar como funções puras com testes (variação, faixa, inversão de escalas de sintomas, ocultação n<10).
- Radar em SVG próprio; tokens de cor no CSS do portal, sem cores fixas nos componentes.
