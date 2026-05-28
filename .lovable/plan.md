## Remover botão de alternância de tenant do header

### Contexto
O header (`src/components/ui/header.tsx`) exibe um botão com a logo do "outro tenant" (ex: logo da MEDCOS no site da Rede Bem-Estar e vice-versa). O usuário solicitou remover esse botão em ambos os sites.

### Alterações
1. **Desktop header** — Remover o bloco "Logo Secundário (Outro Tenant)" (linhas ~149–168) que renderiza um botão com a logo do `otherTenant`.
2. **Mobile menu** — Remover o bloco do tenant switcher dentro da seção "Ações" (linhas ~426–446) que também renderiza o botão do `otherTenant`.
3. **Limpeza** — Remover estado, funções e imports auxiliares que só eram usados pelo switcher (`allTenants`, `targetTenant`, `handleTenantNavigation`, `fetchTenants` effect, `UnderConstructionModal` no header).

### Resultado esperado
Nenhum botão de troca de tenant será exibido no header, nem no desktop nem no mobile, independentemente de qual site o usuário esteja visualizando.