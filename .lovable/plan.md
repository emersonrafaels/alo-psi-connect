

## Melhorar UX dos Cards de Resumo de Risco

### Problema atual

1. O botao maximizar esta com `absolute top-2 right-2`, sobrepondo a porcentagem
2. A porcentagem esta pequena (`text-[11px]`) e pouco legivel

### Solucao

**Arquivo: `src/components/institution/StudentTriageTab.tsx` (linhas ~616-663)**

Reorganizar o layout do card para:

1. **Remover o botao maximizar do posicionamento absoluto** e integrando-o ao layout do header do card
2. **Aumentar a porcentagem** para `text-lg font-bold` tornando-a um destaque visual do card
3. **Novo layout do header**:

```text
+--------------------------------------+
|  [Icon]              38%  [Maximize] |
|  3 (+3)                              |
|  Critico                             |
|  ================================    |
+--------------------------------------+
```

Detalhes das mudancas:

- Linha 622-629: Remover o `<button>` absoluto do maximize
- Linha 631-638: Transformar o header em `flex items-center justify-between` com tres elementos:
  - Esquerda: icone de risco no badge colorido
  - Direita: porcentagem em `text-lg font-bold` + botao maximize ao lado (com `opacity-40 hover:opacity-100`)
- Porcentagem passa de `text-[11px] text-muted-foreground` para `text-lg font-bold` com a cor do nivel de risco para maior destaque
- Botao maximize fica inline, sem fundo, icone `h-3.5 w-3.5`, sempre visivel com opacidade reduzida

### Arquivo afetado

| Arquivo | Acao |
|---|---|
| `src/components/institution/StudentTriageTab.tsx` | Reorganizar header dos cards de risco (linhas 620-638), remover botao absoluto, aumentar porcentagem, integrar maximize inline |

