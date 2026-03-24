

## Renomear e melhorar UX/UI da seção de indicadores

### Alterações em `src/pages/About.tsx` (linhas 413-434)

**1. Título**: "Indicadores de impacto" → "Impacto"

**2. Melhorar UX/UI dos big numbers**:
- Remover o ícone BarChart3 do título (mais clean)
- Cada métrica ganha um card individual com fundo sutil (`bg-[#5B218E]/5`, `bg-[#E281BB]/10`, `bg-[#97D3D9]/10`), `rounded-xl`, e padding generoso
- Números maiores: `text-5xl` em vez de `text-4xl`
- Labels com `font-medium` e `text-base` para melhor legibilidade
- Adicionar uma descrição curta abaixo de cada label (ex: "dos estudantes continuam o acompanhamento", "satisfação média dos estudantes", "suportes estruturados realizados")
- Remover o Card wrapper externo pesado — usar grid direto com 3 mini-cards independentes
- Responsivo: `grid-cols-1 sm:grid-cols-3`

### Arquivo
- `src/pages/About.tsx`

