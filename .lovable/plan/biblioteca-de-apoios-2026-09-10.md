# Biblioteca de Apoios

Nova área da Rede Bem-Estar onde o estudante encontra, em um só lugar, todos os apoios disponíveis para ele: os da plataforma e os da própria instituição.

## O que o estudante vê

Página `/biblioteca-apoios` (e a versão `/medcos/...`), no visual roxo/rosa da Rede Bem-Estar:

- Abertura com busca, contagem de apoios da plataforma e da instituição, e o Buddy sugerindo caminhos.
- Abas de origem: Todos · Plataforma · Minha instituição.
- Filtros por categoria (Saúde emocional, Vida acadêmica, Apoio material, Acessibilidade, Carreira, Parentalidade, Pertencimento, Práticas e conteúdos), formato (atendimento individual, grupo, mentoria, orientação, prática, trilha, conteúdo) e forma de acesso (imediato, direto, agendamento, consultar instituição).
- Cartões com ícone, origem, resumo, etiquetas e botão de detalhes.
- Ficha completa de cada apoio: o que é, como acessar, quando faz sentido, quem oferece e botão de ação (agendar, abrir prática, falar com o setor etc.).
- Favoritos e histórico de apoios visitados.
- "Meu plano de apoio": o estudante junta os apoios que quer seguir e pode imprimir/salvar.
- Quiz "encontre o apoio que combina com você": duas perguntas rápidas que aplicam filtros e sugerem apoios.
- Quem não tem instituição vinculada vê só os apoios da plataforma (a aba da instituição não aparece).

Os apoios que apontam para recursos já existentes (práticas, encontros em grupo, agendamento com profissional, escalas, diário) levam direto para essas páginas.

## O que o admin da Rede Bem-Estar vê

Página `/admin/biblioteca-apoios`:

- Aba **Catálogo**: cadastro dos apoios da plataforma (texto, categoria, formato, acesso, ícone, ação, destaque, ativo/inativo) e dos modelos de apoio institucional.
- Aba **Por instituição**: escolhe a instituição e marca quais apoios da plataforma entram no plano dela, além de liberar quais categorias ela pode oferecer. Visão de quantos apoios cada instituição já publicou.

## O que a instituição vê

Nova aba no Portal Institucional (`/portal-institucional/apoios`):

- Lista dos apoios do catálogo institucional para ligar/desligar, ajustando canal de contato, responsável e observações.
- Cadastro de apoios exclusivos da instituição (nome, descrição, como acessar, quando procurar, responsável, contato).
- Aviso quando uma categoria não está liberada no plano.
- Prévia de como o estudante verá a biblioteca.

## Detalhes técnicos

Banco (migration, com GRANTs e RLS):

- `support_catalog` — apoios base: `slug`, `title`, `origin_type` (`platform` | `institution`), `category`, `format`, `access_type`, `icon`, `description`, `details`, `how_to`, `when_to`, `provider`, `cta_label`, `cta_route`, `featured`, `is_active`, `sort_order`.
- `institution_support_plan` — o que o admin liberou por instituição: `institution_id`, `catalog_id`, `is_included`; e `allowed_categories text[]` por instituição (tabela `institution_support_settings`).
- `institution_supports` — o que a instituição publica: `institution_id`, `catalog_id` (nulo quando é apoio próprio), `title`, `description`, `how_to`, `when_to`, `provider`, `contact_channel`, `contact_value`, `category`, `format`, `access_type`, `icon`, `is_published`.
- `support_favorites`, `support_visits`, `support_plan_items` — favoritos, histórico e plano do estudante, ligados a `auth.uid()`.

Regras de acesso: catálogo ativo legível por todos; ligações da instituição legíveis por membros da instituição e por estudantes vinculados via `patient_institutions`; escrita da instituição restrita a admins da instituição (`has_institution_permission`) e a admins do site (`has_role`); dados do estudante só dele.

Frontend: `src/features/apoios/` com tipos, catálogo de ícones (lucide), hooks `useSupportLibrary`, `useInstitutionSupports`, `useAdminSupportPlan`, `useSupportPlan`; páginas em `src/pages/apoios/BibliotecaApoios.tsx`, `src/pages/admin/SupportLibraryAdmin.tsx`, `src/pages/institution/InstitutionSupports.tsx`; rotas em `App.tsx` (versões padrão e `/medcos`) e itens no `AdminSidebar` e no menu do portal institucional. Seed dos 29 apoios do protótipo (15 institucionais + 14 da plataforma) via `run_sql`.
