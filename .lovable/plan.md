## Objetivo

O item "Radar Institucional" deixa de ser exibido para visitantes e pacientes. Ele passa a aparecer no menu apenas para usuários institucionais, e também dentro do Portal Institucional. A página em si continua acessível por link direto (para prospecção de instituições ainda não cadastradas).

## O que muda

**1. Header (`src/components/ui/header.tsx`)**
- O item "Radar Institucional" passa a ser inserido condicionalmente na lista de navegação, apenas quando o usuário tem papel institucional (`institution_admin` ou `facilitator`) — ambos já são carregados no componente via `useUserRole`.
- Enquanto os papéis estiverem carregando, o item não é exibido (evita "piscar" para visitantes).
- Mesma condição aplicada ao menu mobile, que reutiliza a mesma lista `navigation`.
- Para usuários institucionais, o link aponta para o radar dentro do portal (`/portal-institucional/radar`), que é a versão autenticada e vinculada à instituição.

**2. Rodapé (`src/components/ui/footer.tsx`)**
- Remover as duas entradas de "Radar Institucional" ("Links úteis" e "Navegação"), já que o rodapé é visto por todos os visitantes.

**3. Portal Institucional (`src/pages/InstitutionPortal.tsx`)**
- Reforçar o acesso: além do card já existente, incluir um ponto de entrada visível e consistente para o Radar (botão/atalho no topo do portal, ao lado das demais ações), levando a `/portal-institucional/radar`.

## O que NÃO muda

- A rota pública `/radar-institucional` e `/radar-institucional/resultado/:token` continuam funcionando por link direto, sem login — apenas deixam de ser divulgadas na navegação.
- Nenhuma alteração de banco de dados, RLS ou edge functions.

## Detalhes técnicos

- `useUserRole('institution_admin')` e `useUserRole('facilitator')` já estão instanciados no `Header`; basta usar `isInstitutionAdmin || isFacilitator` e os respectivos `loading`.
- Links continuam construídos com `buildTenantPath(tenantSlug, ...)` para preservar o contexto multi-tenant (`/medcos/...`).
- Verificação final com Playwright: header como visitante (sem o item), e header autenticado como usuário institucional (com o item apontando para o portal).
