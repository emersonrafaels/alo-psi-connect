## Objetivo
Tornar o Radar Institucional acessível a partir dos menus de navegação principais do site, já que a ferramenta é pública e pode ser usada por gestores de instituições ainda não cadastradas.

## O que será feito
1. **Header principal (`src/components/ui/header.tsx`)**
   - Incluir o item **"Radar Institucional"** na lista `allNavigation`, após "Sobre" e antes de "Profissionais".
   - Aplicar a mesma regra de módulos (sem restrição de módulo, `module: null`).
   - O link será `buildTenantPath(tenantSlug, '/radar-institucional')` para manter o contexto do tenant.
   - O item aparecerá automaticamente na navegação desktop e no menu mobile, pois ambos consomem `navigation`.

2. **Footer (`src/components/ui/footer.tsx`)**
   - Adicionar **"Radar Institucional"** em ambas as seções:
     - "Links úteis" (com ícone `Radar` ou `Compass`).
     - "Navegação".
   - Link: `buildTenantPath(tenantSlug, '/radar-institucional')`.

3. **Portal Institucional (`src/pages/InstitutionPortal.tsx`)**
   - O portal já possui um card "Radar Institucional" na visão geral e uma rota `/portal-institucional/radar`. Verificar se é necessário adicionar uma aba dedicada no `TabsList` para deixar o acesso mais explícito (opcional, a ser validado na implementação).

## Critérios de aceitação
- O link "Radar Institucional" aparece no header desktop e no menu mobile.
- O link aparece no footer em "Links úteis" e "Navegação".
- O link respeita o tenant/slug atual da URL.
- A navegação continua responsiva e sem quebras visuais.

## Arquivos envolvidos
- `src/components/ui/header.tsx`
- `src/components/ui/footer.tsx`
- `src/pages/InstitutionPortal.tsx` (verificação opcional de aba)