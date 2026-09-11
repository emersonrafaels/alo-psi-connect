# Gestão de Apoios: criar apoios, filtros e indicadores

Melhorias na página **Gerenciar Apoios** (`/gerenciar-apoios`), aba Catálogo.

## 1. Botão "Novo apoio"

- Botão no topo da aba Catálogo abre o mesmo formulário usado na edição, agora em modo de criação.
- Campos: título, descrição, detalhes, como acessar, quando faz sentido, origem (Plataforma / Modelo institucional), categoria, formato, tipo de acesso, ícone, responsável, texto e destino do botão, destaque, ativo.
- Categoria, formato e acesso usam as listas já existentes na biblioteca.
- O identificador interno (slug) é gerado a partir do título e a ordem é a última da lista.
- Ao salvar, o apoio aparece imediatamente na lista e passa a valer para as instituições conforme o plano de cada uma.

## 2. Filtros

Acima da lista, além da busca já existente:
- Origem: todas / plataforma / modelo institucional
- Categoria
- Formato
- Acesso
- Situação: todos / ativos / inativos
- Apenas destaques
- Contador de resultados e botão para limpar filtros

## 3. Indicadores

Faixa de cartões no topo da aba Catálogo:
- Total de apoios (e quantos ativos)
- Apoios em destaque
- Total de favoritos dos alunos
- Total de acessos (histórico de visitas)
- Lista curta "Mais favoritados" e "Mais acessados" (top 5 cada)

Cada card do catálogo também mostra, em texto pequeno, quantas vezes o apoio foi favoritado e acessado.

## Detalhes técnicos

- **Novos dados**: favoritos e histórico hoje só são legíveis pelo próprio usuário (RLS por `user_id`). Criar duas funções `security definer` que retornam apenas contagens agregadas, sem identificar alunos:
  - `get_support_favorites_counts()` → `support_key`, `total`
  - `get_support_visits_counts()` → `support_key`, `total`
  Ambas retornam vazio para quem não é `admin`/`super_admin` (checagem via `has_role`). `GRANT EXECUTE` para `authenticated`.
- **Hooks** (`src/hooks/useAdminSupportPlan.tsx`): adicionar `useSupportUsageMetrics()` (chama as duas RPCs e mapeia por `support_key`, formato `catalog:<id>`) e `createCatalog` nas mutations, invalidando `support-catalog`.
- **UI** (`src/pages/admin/SupportLibraryAdmin.tsx`): extrair o diálogo de apoio para modo criar/editar, adicionar barra de filtros com estado local e a faixa de indicadores. Sem mudanças na visão do aluno nem na visão da instituição.
