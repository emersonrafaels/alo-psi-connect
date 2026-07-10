# Redesign dos dialogs de detalhe dos KPIs

O dialog atual (ex: "Alunos ativos nos últimos 7 dias") está apertado, com números empilhados nas barras, sem hierarquia visual e sem contexto. Vou reformatar os 4 dialogs do `InstitutionExecutiveHeader.tsx` para ficarem legíveis e informativos.

## Mudanças por dialog

### 1. Alunos ativos (7d)
- Header do dialog com KPI grande à esquerda (valor + label) e delta vs. semana anterior à direita, com seta ↑/↓/→ colorida.
- Substituir o `BarChart` compacto por gráfico maior (altura 180px), barras mais largas com gradiente, valor no topo com pill de fundo (evita colisão), rótulo do dia embaixo em 2 linhas (dia da semana + data curta ex "Qui 03/07"), destaque visual para "hoje".
- Linha média pontilhada horizontal com label "média: X".
- Rodapé com 2 cards: "Últimos 7 dias" e "Semana anterior" + micro texto explicativo.

### 2. Engajamento
- Donut maior (160px) centralizado com valor + label.
- 3 mini-stats abaixo em linha: ativos, vinculados, meta (40%).
- Barra de progresso com marcadores de referência (20% baixo / 40% saudável / 60% excelente) e badge colorido do status atual.

### 3. Alertas críticos abertos
- Se 0: estado vazio ilustrado (ícone check verde + mensagem tranquilizadora).
- Se >0: cards de triagem mais espaçados, com badge de severidade, título em 2 linhas máx, subtitle em muted, e botão "Abrir" por item além do CTA principal.

### 4. Taxa de resolução
- Donut maior + legenda lateral (Resolvidas verde / Em aberto âmbar) com pontos coloridos, em vez de dois cards genéricos.
- Barra horizontal segmentada mostrando proporção resolvidas/abertas.
- Texto interpretativo: "Meta saudável ≥ 70%".

## Padrões visuais compartilhados
- `DialogContent` com `max-w-xl` (era `max-w-lg`) e padding interno maior.
- Seções separadas por `border-t border-border/50` com espaçamento `space-y-5`.
- Tipografia: título 18px, números principais 32-36px, rótulos 11px uppercase tracking-wide muted.
- Cores por tom via tokens semânticos existentes (primary, emerald, amber, rose) — sem hardcode.
- Componentes internos extraídos: `MiniStat`, `TrendPill`, `LegendDot` no próprio arquivo para reuso entre os 4 dialogs.

## Arquivos afetados
- `src/components/institution/InstitutionExecutiveHeader.tsx` — reescrever `BarChart`, `Donut` e `KpiDetailDialog` (e adicionar helpers `MiniStat`, `TrendPill`, `LegendDot`, `ProgressWithMarkers`).

Nenhuma mudança em hooks, dados ou navegação — apenas apresentação.
