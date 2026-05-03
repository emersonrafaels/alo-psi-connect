# Melhorar formato da "Última análise da IA"

**Em `src/pages/MoodPattern.tsx`:**

1. Renderizar `latestInsight.insight_content` com `ReactMarkdown` (já instalado, `react-markdown` + `remark-gfm`) em vez de `<p whitespace-pre-line>`. Assim `##`, `###`, `**negrito**`, listas e links viram formatação real.
2. Envolver em wrapper Tailwind `prose prose-sm dark:prose-invert` com pequenos ajustes (`prose-headings:mt-3 prose-headings:mb-2 prose-p:my-2 prose-li:my-0.5 prose-strong:text-foreground`).
3. Remover o `line-clamp-6` para o conteúdo formatado aparecer por inteiro.
4. Trocar o texto do botão **"Explorar nas Análises"** → **"Explorar mais Análises"**.

Sem novos arquivos, sem dependências novas. Plugin `@tailwindcss/typography` já é usado no projeto (classe `prose`).