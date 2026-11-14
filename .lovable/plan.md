# Coordenação clínica: escolher instituição em todo o Portal Institucional

## Objetivo
Ao abrir qualquer página do Portal Institucional (Visão geral, Alunos, Triagem, Comparador, Radar, Mensagens, Apoios, Profissionais, Métricas), a Coordenação clínica (e Admin RBE) escolhe a instituição num seletor e vê exatamente o que o gestor daquela instituição vê — com alunos sempre anonimizados (`Aluno #N`).

## O que muda para o usuário
- Seletor "Instituição" no topo do portal (na faixa "Visualizando como equipe Rede Bem-Estar"), com busca por nome e logo.
- A escolha vale para todas as páginas do portal e fica salva ao navegar entre elas; trocar a instituição recarrega os dados da página atual.
- Entrar no portal sem instituição escolhida (ex.: link direto para /portal-institucional/triagem) abre o seletor em vez de uma tela vazia; se houver apenas a última escolhida, ela é reaproveitada.
- Botão "Voltar ao Meu espaço" continua disponível.

## Verificações de "mesma visão"
- Conferir, com a conta de teste de Coordenação clínica, cada página do portal para a Afya e compará-la com a visão do gestor Afya (mesmos números/cards).
- Onde a página depender de uma regra de acesso que só libera membros da instituição, ampliar essa regra para a equipe clínica, somente leitura onde fizer sentido e sem revelar nomes, textos privados ou grupos com menos de 10 pessoas.

## Detalhes técnicos
- `useInstitutionAccess.tsx`: hoje o modo equipe só ativa com `?inst=` ou `sessionStorage`; sem isso retorna vazio. Adicionar lista de instituições ativas para staff (`educational_institutions`), expor `isStaffView`, `staffInstitutions`, `setStaffInstitution(id)` (atualiza `?inst=` e sessionStorage, invalida queries do portal).
- Novo `StaffInstitutionPicker` (Command/cmdk com `keywords` = nome, pois `value` é UUID) dentro de `StaffViewBanner`; banner renderizado em `PortalPageShell` para cobrir todas as páginas.
- Propagar `?inst=` nos links do `PortalSidebar` e nos atalhos internos.
- Auditar RPCs/consultas por página (`get_institution_*`, `user_has_institution_access`, `user_belongs_to_institution`, políticas de `institution_*`) e, se bloquearem staff, migração permitindo `clinical_coordinator`/`admin_rbe` via `has_role`.
- Teste: regra pura de resolução da instituição ativa (URL > sessão > nenhuma → mostrar seletor).
