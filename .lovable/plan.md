# Adicionar filtros à página de Triagem

Adicionar uma barra de filtros à página `/triagem` (e ao reaproveitamento em `/admin/pacientes-completo`), permitindo refinar a listagem de pacientes por múltiplos critérios.

## Filtros propostos

**Solicitados:**
- **Gênero** — multi-select (Feminino, Masculino, Não-binário, Outro, Não informado)
- **Faixa de idade** — range slider (0–100) ou presets (<18, 18–24, 25–34, 35–49, 50+)
- **Instituição** — multi-select dinâmico (lista das instituições presentes nos pacientes)
- **Quantidade de diário (30d)** — range numérico (mín/máx)
- **Quantidade de encontros** — range numérico (futuros + passados)
- **Quantidade de consultas** — range numérico (futuras + passadas)

**Adicionais sugeridos:**
- **É estudante** — Sim / Não / Todos
- **Último login** — Nunca / ≤7d / ≤30d / >30d
- **Criado em** — últimos 7/30/90/365 dias / todos
- **Tem diário registrado** — Sim / Não (atalho para "diário total > 0")

Todos os filtros operam em conjunto (AND) com a busca textual já existente. Botão "Limpar filtros" e badge com contador de filtros ativos.

## Implementação

### UI
Novo componente `src/components/triagem/PatientsTriageFilters.tsx`:
- Linha de filtros acima da tabela (após a barra de busca).
- Usa `Popover` + `Badge` para filtros multi-select compactos (mesmo padrão do `AnalyticsFilters`).
- Range numéricos via dois `Input type="number"` (mín/máx).
- Faixa etária via presets em `Select` (mais simples que slider).
- Botão "Limpar" aparece quando há filtros ativos.

### Estado e filtragem
Em `src/components/triagem/PatientsTriageView.tsx`:
- Adicionar estado `filters` com a forma definida em `PatientsTriageFilters`.
- **Filtrar no client-side** sobre `data.rows` (o edge function já retorna a página atual com todos os campos necessários: `genero`, `data_nascimento`, `institutions`, `mood`, `sessions`, `appointments`, `eh_estudante`, `last_sign_in_at`, `created_at`).
- Aplicar filtros antes da renderização da tabela e do CSV export (export reflete o filtro ativo).

### Observação sobre paginação
Como a filtragem é client-side sobre a página atual (50 itens), filtros podem reduzir o número de linhas visíveis em uma página. Para a primeira versão, manter assim e exibir aviso "X de Y nesta página após filtros". Caso a UX exija filtragem global, em iteração futura mover os filtros para o edge function `admin-patients-overview` (parâmetros adicionais no body).

### Arquivos
- **Criar** `src/components/triagem/PatientsTriageFilters.tsx`
- **Editar** `src/components/triagem/PatientsTriageView.tsx` — integrar filtros, aplicar lógica de filtragem, ajustar contador e CSV

### Fora de escopo
- Sem mudanças no edge function, hooks, RLS, ou rotas.
- Sem mudanças no drawer de detalhes.
