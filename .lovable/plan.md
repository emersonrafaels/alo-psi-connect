

## Ajustes de botoes, consistencia de textos e modal de painel institucional

### 1. Corrigir cores dos botoes na Homepage (`src/pages/Index.tsx`)

**Hero (linhas 158-165)**: O botao "Falar com a equipe" tem `border-white/40` e `text-white` mas o texto fica invisivel no fundo roxo (conforme screenshot). Corrigir:
- CTA primario: `bg-white text-[#5B218E]` (OK, manter)
- CTA secundario: adicionar `border-2 border-white` para visibilidade, remover `variant="outline"`

**CTA Final (linhas 449-456)**: Mesmo problema — corrigir botao secundario com `border-2 border-white`

**Secao Dados (linha 304)**: Botao "Ver exemplo de painel" — mudar de `variant="outline"` para estilo com fundo roxo: `bg-[#5B218E] text-white hover:bg-[#5B218E]/90`

### 2. Consistencia de textos Homepage ↔ Sobre

- Homepage Hero ja usa mesmos textos que o briefing. OK.
- Homepage "Dados" (linhas 286-306): textos ja alinhados com About. OK.
- Homepage Governanca titulo (linha 317): ja diz "Base clinica, etica e privacidade". OK.
- Secao Equipe titulo (linha 341): ja alinhado. OK.

Pequenos ajustes de consistencia:
- Homepage subtitle "83% dos estudantes..." (linha 194) — manter, e bom dado
- Verificar que About e Homepage usam mesmos termos nos pilares — ja estao alinhados

### 3. Modal "Ver exemplo de painel" — Homepage e About

Criar um componente `InstitutionalDashboardModal` com dados fake que mostra:
- **Grafico de barras** simulado (CSS puro) com adesao por periodo (1o sem, 2o sem, 3o sem, 4o sem)
- **Big numbers**: 87% Adesao, 4.8/5 Avaliacao, 320/mes Acompanhamentos, 12 Cursos ativos
- **Lista de temas recorrentes**: Ansiedade (32%), Burnout academico (24%), Relacoes interpessoais (18%), Autoestima (14%), Outros (12%)
- **Indicador de risco**: 3 alertas ativos simulados

Usar `Dialog` do shadcn/ui. Layout em grid 2x2 com cards internos. Cores da paleta RBE.

**Arquivos**:
- Novo: `src/components/InstitutionalDashboardModal.tsx`
- Editar: `src/pages/Index.tsx` — importar modal, adicionar state, conectar botao "Ver exemplo de painel" (linha 304)
- Editar: `src/pages/About.tsx` — importar modal, conectar botao "Solicitar demonstracao" (linha 394-400) — mudar texto para "Ver exemplo de painel" e abrir modal em vez de navegar

### Arquivos afetados
- `src/components/InstitutionalDashboardModal.tsx` (novo)
- `src/pages/Index.tsx` (botoes + modal)
- `src/pages/About.tsx` (botao dados + modal)

