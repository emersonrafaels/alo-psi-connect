# Renderizador unificado de conteúdo da IA com formatação aprimorada

## Problema

A análise da IA é renderizada com `ReactMarkdown` cru + classes `prose` em `MoodPattern.tsx`. Como o backend devolve o texto com `##`/`###` mas sem linhas em branco entre blocos, o markdown vira parágrafo único: títulos viram texto preto pequeno, sem espaçamento e sem hierarquia (vide print).

Também temos outros pontos onde o mesmo conteúdo aparece sem markdown algum (`InsightHistoryCard`).

## Solução

### 1. Criar componente único `FormattedAIContent`

Arquivo: `src/components/ai/FormattedAIContent.tsx`

Responsabilidades:
- **Pré-processamento (`preformat`)** do texto bruto antes de renderizar:
  - Normaliza `\r\n` → `\n`
  - Colapsa 3+ linhas em branco em uma só
  - Garante linha em branco **antes e depois** de qualquer `## Heading` (corrige o bug atual em que tudo cola)
  - Converte bullets `•` / `·` para `- ` markdown
- **Renderização** via `ReactMarkdown + remarkGfm` com `components` totalmente customizados (todos usando tokens semânticos do design system, nada de cores hard-coded):
  - `h1`: 20px, `text-primary`, separador inferior, mt-6
  - `h2`: 18px, `text-primary`, mt-5
  - `h3`: 16px, semibold, **com barra vertical primária** à esquerda (chip visual) — visual claro de seção
  - `h4`: 14px, semibold
  - `p`: leading-relaxed, my-2.5
  - `strong`: text-foreground destacado
  - `ul`: bullets customizados (ponto colorido `bg-primary` via `::before`), espaçamento entre itens
  - `ol`: marcadores numéricos coloridos `marker:text-primary`
  - `blockquote`: borda esquerda `border-primary/60` + fundo `bg-primary/5`
  - `code` inline e bloco com `bg-muted`
  - `table` com bordas em `border-border` e header em `bg-muted`
  - `a` abre em nova aba, `text-primary underline`
  - `hr` com `border-border`

API: `<FormattedAIContent content={string} className?: string />`

### 2. Substituir os usos atuais

| Arquivo | Mudança |
|---|---|
| `src/pages/MoodPattern.tsx` | Remover wrapper `prose` + `ReactMarkdown` inline; usar `<FormattedAIContent content={latestInsight.insight_content} />`. Limpar imports não usados (`ReactMarkdown`, `remarkGfm`). |
| `src/components/InsightHistoryCard.tsx` | Onde hoje renderiza `{insight.insight_content}` como texto cru (linhas 170 e 191), passar a usar `<FormattedAIContent content={insight.insight_content} />`. Mantém o `line-clamp` no preview colapsado se houver. |

### 3. Não mexer

- `src/components/AIAssistantModal.tsx` já tem seu próprio renderizador customizado para o chat — fora do escopo desta tarefa para não regredir o estilo do chat.

## Resumo de arquivos

**Criar**
- `src/components/ai/FormattedAIContent.tsx`

**Editar**
- `src/pages/MoodPattern.tsx` — usar o novo componente, remover imports não usados
- `src/components/InsightHistoryCard.tsx` — usar o novo componente nos dois pontos onde o conteúdo é exibido

Sem novas dependências (`react-markdown` e `remark-gfm` já instalados).