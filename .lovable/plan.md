# Abrir o portal completo da instituição a partir do Meu espaço da Coordenação clínica

## Objetivo
Hoje o botão "Abrir" de cada instituição leva ao painel administrativo simplificado. Ele passará a abrir o **Portal Institucional completo** (Visão geral, Triagem, Comparador, Alunos, Métricas...) exatamente como o gestor daquela instituição vê, mantendo alunos sempre como `Aluno #N`.

## O que muda para o usuário
- "Abrir" leva ao Portal Institucional da instituição clicada.
- Uma faixa no topo indica "Visualizando como equipe Rede Bem-Estar — {Instituição}", com seletor para trocar de instituição e botão "Voltar ao Meu espaço".
- A navegação entre seções (Triagem, Comparador etc.) mantém a instituição escolhida.
- Vale também para Admin RBE e admins (mesmo botão no Meu espaço deles).
- Ações de escrita seguem as permissões já aprovadas (Coordenação clínica pode editar triagem; nunca vê nomes).

## Detalhes técnicos
1. `StaffHome.tsx`: link "Abrir" → `/portal-institucional?inst=<id>`.
2. `useInstitutionAccess`: se o usuário tiver role `admin`/`super_admin`/`admin_rbe`/`clinical_coordinator` e houver `?inst=` (ou instituição de staff guardada em sessionStorage), retornar essa instituição como `userInstitutions` sintético com papel de visualização, em vez de depender de `institution_users`.
3. Rotas `/portal-institucional/*` (`ProtectedRoute requiredRole="institution_admin"`): aceitar também os roles de staff.
4. `PortalSidebar` e links internos preservam `inst` na URL.
5. Anonimização forçada `Aluno #N` em modo staff, independente da configuração da instituição.
6. Verificar no banco se as RPCs agregadas (`get_institution_*`, triagem, mensagens) autorizam os roles de staff; onde só checam vínculo institucional, adicionar `has_role(...admin_rbe/clinical_coordinator/admin)` via migração. Mensagens: apenas leitura para coordenação clínica.
7. Testar com `test-clinica@test.com` no browser: abrir duas instituições diferentes, conferir dados distintos, Triagem e Comparador carregando e nomes anonimizados.
