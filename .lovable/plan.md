## Objetivo

Além das instituições, permitir que administradores e usuários específicos escolhidos no painel admin vejam e acessem o Radar Institucional.

## Regras de acesso

Um usuário vê o item "Radar Institucional" no menu e pode abrir a página quando:
1. É admin da instituição ou facilitador (comportamento atual), OU
2. Tem papel `admin` / `super_admin`, OU
3. Está na nova lista de acesso liberada manualmente no admin.

## Banco de dados

Nova tabela `radar_access_grants`:
- usuário liberado, quem liberou, observação opcional, data de criação.
- Grants para `authenticated` e `service_role`.
- RLS: o próprio usuário pode ver seu registro; apenas admin/super_admin podem ver todos, criar e remover.

Nova função de segurança `has_radar_access(_user_id)` que retorna verdadeiro para admin, super_admin, admin de instituição, facilitador ou usuário presente na lista — usada tanto no front quanto em políticas futuras.

## Interface admin

Nova aba/página "Acesso ao Radar" dentro do admin (ao lado do Radar Institucional):
- Busca de usuário por nome/e-mail (a partir de `profiles`).
- Botão para liberar acesso, com campo opcional de observação.
- Tabela com os usuários liberados, quem liberou, data e ação de remover.
- Estados de carregamento, vazio e confirmação de remoção.

## Front-end

- Novo hook `useRadarAccess()` que consulta a função `has_radar_access` e retorna `{ hasAccess, loading }`.
- `src/components/ui/header.tsx`: trocar a condição atual `isInstitutionAdmin || isFacilitator` por `hasAccess` do novo hook (desktop e mobile).
- Destino do link: portal institucional do radar para usuários institucionais; para admins/usuários liberados sem instituição, a página admin do radar (lista de diagnósticos).
- Proteger a rota do radar com o mesmo hook, redirecionando quem não tem acesso.

## Detalhes técnicos

- A função `has_radar_access` é `security definer` com `search_path = public`, evitando recursão de RLS.
- Papéis continuam em `user_roles`; a nova tabela apenas complementa com exceções pontuais, sem armazenar papéis.
- A página pública `/radar-institucional` permanece inalterada.
