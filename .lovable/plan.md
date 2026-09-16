# Apoios no portal institucional

Incluir um item "Apoios" na barra de abas do portal institucional, logo depois de "Cupons", que leva a instituição direto para a página onde ela escolhe os apoios disponíveis para os alunos.

## Comportamento

- O novo item aparece na mesma linha das abas atuais (Visão Geral, Cupons, Apoios, Métricas, Diário Emocional, Triagem, Notas, Buddy).
- Ao clicar, em vez de trocar de aba, a instituição é levada à página de seleção de apoios que já existe.
- Ícone de coração (mesmo usado na área de apoios) para manter a leitura visual das abas.
- Funciona igual no domínio principal e no ambiente Medcos, respeitando o prefixo da instituição.

## Detalhes técnicos

- `src/pages/InstitutionPortal.tsx`: acrescentar, entre os gatilhos `coupons` e `metrics`, um botão com o mesmo estilo dos `TabsTrigger` que chama `navigate(buildTenantPath(tenant?.slug, '/portal-institucional/apoios'))`.
- Reaproveita a rota e a página existentes (`/portal-institucional/apoios` → `InstitutionSupports.tsx`); nenhuma nova rota, tabela ou consulta.
- Também já existe um card de Apoios na Visão Geral; ele permanece como está.
