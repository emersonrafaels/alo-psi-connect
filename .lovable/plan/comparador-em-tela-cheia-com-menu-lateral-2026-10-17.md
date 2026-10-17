# Comparador em tela cheia com menu lateral

## O que muda
- O Comparador abre em **tela cheia**, sem o cabeçalho e o rodapé do site.
- **Menu lateral fixo à esquerda** com:
  - Nome da instituição e selo "Comparador".
  - Navegação: Visão Geral e Análise Integrada (substituindo as abas atuais).
  - Filtros: unidade (Toda a rede ou cada unidade) e coleta semestral.
  - Botão **"Voltar ao Portal Institucional"** fixo no rodapé do menu.
- No celular, o menu vira uma gaveta aberta por um botão no topo.

## Gráficos mais chamativos (como na referência)
- **Mini gráficos das 3 coletas:** maiores, com área preenchida em degradê, pontos destacados, último ponto maior com rótulo do valor e cor conforme a tendência (favorável, estável ou desfavorável).
- **Posição na escala:** barra mais grossa em degradê, do pior para o melhor, com marcador circular, valor ao lado e rótulos nas pontas.
- **Selos de variação:** pílulas com seta e cor (favorável, estável ou desfavorável).
- **Cartões do topo:** número em destaque, pequena barra de progresso (ex.: cobertura) e selo de variação.
- **Mapa de unidades e cursos:** células com intensidade de cor proporcional à distância da média da rede, legenda em escala e grupos protegidos hachurados.
- **Participação:** funil com barras arredondadas em degradê e percentuais em destaque.
- **Análise Integrada:** gráfico de linhas comparando os dois recortes nas 3 coletas para o instrumento escolhido, além da tabela atual com barras de diferença.

## Técnico
- Página `InstitutionComparator.tsx` reorganizada em layout próprio com o `Sidebar` do shadcn (`SidebarProvider`, recolhível), sem `Header`/`Footer`.
- Gráficos em SVG próprio e Recharts (já no projeto), com cores dos tokens semânticos (`--primary`, `--destructive`, `--chart-*`) e novas variáveis de degradê em `index.css`.
- Dados e regras de privacidade (grupos com n < 10 ocultos) inalterados.
