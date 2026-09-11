# Indicadores da Gestão de Apoios: separar "usados" de "acessados" + explicações

Na página **Gerenciar Apoios** (`/gerenciar-apoios`), aba Catálogo, hoje o cartão "Apoios usados" mostra na verdade a contagem de acessos. Vamos separar os dois conceitos e explicar cada indicador.

## Definições

- **Acessados**: o aluno abriu/clicou no apoio na biblioteca (registro de visita). Mede curiosidade e alcance.
- **Usados**: o aluno adicionou o apoio ao "Meu plano de apoio", ou seja, assumiu que vai usar aquele apoio. Mede adoção real.
- **Favoritos**: o aluno salvou o apoio para consultar depois.

Cada aluno conta uma vez por apoio em cada um desses indicadores.

## Mudanças na tela

1. Faixa de indicadores passa a ter 5 cartões:
   - Apoios no catálogo (e quantos ativos)
   - Em destaque
   - Favoritos dos alunos
   - Apoios acessados
   - Apoios usados (no plano dos alunos)
2. Cada cartão ganha um ícone de informação com um pequeno balão explicando o que o número significa, no texto acima.
3. Passam a existir três listas de top 5: **Mais favoritados**, **Mais acessados** e **Mais usados**.
4. Em cada card de apoio do catálogo, além de favoritos e acessos, aparece também quantas vezes o apoio está no plano dos alunos ("no plano").
5. Um aviso curto no topo da faixa: os números são agregados e não identificam alunos.

## Detalhes técnicos

- Nova função `security definer` `get_support_plan_counts()` → (`support_key`, `total`) agregando `support_plan_items`, com a mesma checagem de `has_role` admin/super_admin usada nas duas funções existentes e `GRANT EXECUTE` para `authenticated`.
- `src/hooks/useAdminSupportPlan.tsx`: `useSupportUsageMetrics()` passa a chamar as três RPCs e retornar `favorites`, `visits`, `planItems` e seus totais.
- `src/pages/admin/SupportLibraryAdmin.tsx`: renomear o indicador atual para "Apoios acessados", adicionar o novo indicador de uso, adicionar `Tooltip`/`Popover` (shadcn, já no projeto) com as explicações, terceira lista de top 5 e contador extra nos cards.
- Nenhuma alteração na visão do aluno nem na visão da instituição.
