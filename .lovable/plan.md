

## Corrigir cores dos gráficos no dark mode

### Problema
As variáveis CSS `--chart-2`, `--chart-3`, `--chart-4`, `--chart-5` usadas pelo gráfico de métricas não existem em `src/index.css`. O navegador resolve como valor vazio, resultando em barras pretas — invisíveis no dark mode.

### Solução

**Arquivo: `src/index.css`**

Adicionar as variáveis `--chart-1` a `--chart-5` tanto no `:root` (light) quanto no `.dark` com cores adequadas para cada tema:

- Light mode: tons vibrantes visíveis em fundo claro
- Dark mode: tons mais claros/saturados visíveis em fundo escuro

Cores planejadas (HSL):
| Variável | Light | Dark |
|----------|-------|------|
| `--chart-1` | `280 63% 50%` (roxo/primary) | `280 63% 65%` |
| `--chart-2` | `142 71% 45%` (verde) | `142 71% 55%` |
| `--chart-3` | `38 92% 50%` (laranja) | `38 92% 60%` |
| `--chart-4` | `200 80% 50%` (azul) | `200 80% 65%` |
| `--chart-5` | `330 62% 55%` (rosa) | `330 62% 70%` |

Nenhuma mudança nos componentes — apenas definir as variáveis CSS que já estão sendo referenciadas.

