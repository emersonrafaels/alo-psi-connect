# Apoios da instituição: incluir os apoios da Rede Bem-Estar e melhorar a página

## Problema

Hoje a página de Apoios do portal institucional mostra apenas duas abas: "Meus apoios" (criados pela instituição) e "Modelos prontos". A instituição não vê os apoios que a Rede Bem-Estar já liberou no plano dela — mesmo eles aparecendo para os alunos na Biblioteca de Apoios. Com isso a página abre vazia e passa a impressão de que não há nada disponível.

## O que vai mudar

### 1. Nova aba "Da Rede Bem-Estar"

Lista, em modo leitura, os apoios da plataforma que estão ativos no plano da instituição (catálogo da plataforma menos os itens que a Rede Bem-Estar excluiu do plano). Cada item mostra ícone, título, descrição, categoria, formato, forma de acesso e um selo "Incluído no seu plano". Um aviso curto explica que esses apoios são mantidos pela Rede Bem-Estar e que ajustes no plano são feitos com a equipe.

Se o plano não tiver nenhum apoio da plataforma, a aba mostra uma mensagem explicando isso e sugerindo falar com a Rede Bem-Estar.

### 2. Resumo no topo

Quatro indicadores: apoios da Rede Bem-Estar no plano, apoios próprios publicados, apoios em rascunho e total visível ao aluno (soma do que ele realmente vê). Assim a instituição entende de imediato o que está no ar.

### 3. Melhorias na página

- Busca por texto e filtro por categoria aplicados às listas de apoios próprios, modelos e apoios da rede.
- Empty state de "Meus apoios" com ações diretas: "Ver modelos prontos" e "Criar apoio próprio".
- Cards de apoios próprios com rótulo "Publicado"/"Rascunho" mais claro, categoria/formato como selos em vez de texto corrido, e confirmação antes de excluir um apoio.
- Cabeçalho e abas reorganizados: ordem "Da Rede Bem-Estar", "Meus apoios", "Modelos prontos", com contagem em cada uma.
- Estados de carregamento consistentes (skeletons) e layout responsivo em telas pequenas.

## Detalhes técnicos

- Arquivo principal: `src/pages/institution/InstitutionSupports.tsx` (reescrita da apresentação; nenhuma mudança de banco de dados).
- Fonte dos apoios da rede: `useSupportCatalog()` filtrado por `origin_type === "platform"` e removendo `excludedCatalogIds` de `useInstitutionSupportPlan(institutionId)` — a mesma regra usada em `useStudentSupportLibrary`, garantindo que a instituição veja exatamente o que o aluno vê.
- Reutiliza `SupportIcon`, `Badge`, `Card`, `Tabs`, `Input` e `Select` já existentes; sem novas dependências.
- Exclusão de apoio próprio passa a usar `AlertDialog` de confirmação, mantendo a mutation `remove` atual.
- Nenhuma alteração em hooks de dados, RLS, rotas ou no comportamento de "Ativar" modelos.
