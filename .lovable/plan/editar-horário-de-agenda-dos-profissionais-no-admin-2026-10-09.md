# Editar horário de agenda dos profissionais no admin

## Objetivo
Na página `/admin/professionals`, permitir que o administrador edite a agenda (dias e horários de atendimento) de cada profissional, sem precisar que o próprio profissional acesse o perfil.

## O que já existe
- `src/components/ScheduleManager.tsx` — componente completo de gestão de agenda (listar, adicionar e remover horários por dia da semana, início/fim e duração da consulta), já usado no perfil do profissional. Recebe `professionalId` e grava na tabela `profissionais_sessoes`.
- `src/pages/admin/Professionals.tsx` — listagem admin com ações por card: Editar, Bloqueios, Ver, Deletar.
- `src/components/admin/EditProfessionalModal.tsx` — modal de edição com abas (Upload / URL / Sites).

## Mudanças

### 1. Novo botão "Agenda" em cada card de profissional
- Em `src/pages/admin/Professionals.tsx`, adicionar um botão **Agenda** (ícone `Clock` ou `CalendarClock`) na grade de ações do card, ao lado de "Editar" e "Bloqueios".
- Ao clicar, abre um novo modal com o `ScheduleManager` do profissional selecionado.

### 2. Modal de agenda
- Criar estado `scheduleProfessional` + `scheduleModalOpen` na página.
- Renderizar um `Dialog` (título "Agenda de {nome do profissional}") contendo `<ScheduleManager professionalId={professional.id} />`.
- O componente já trata carregamento, adição, exclusão com confirmação e mensagens de erro — nenhuma alteração necessária nele.

### 3. Acesso também pelo modal de edição (opcional, incluído)
- Em `EditProfessionalModal.tsx`, adicionar uma aba **Agenda** ao lado de Upload/URL/Sites, reutilizando o mesmo `ScheduleManager`, para o admin editar dados e agenda no mesmo lugar.

## Detalhes técnicos
- Nenhuma mudança de banco: a tabela `profissionais_sessoes` e suas políticas já existem e o admin já possui acesso (o mesmo padrão do `UnavailabilityManager`).
- `ScheduleManager` converte automaticamente os dias abreviados do banco (`mon`…`sun`) para o formato de exibição.
- Após salvar/remover horários, a lista do profissional é recarregada pelo próprio componente; a página admin não precisa de refetch.

## Validação
- `bunx tsgo --noEmit` para type-check.
- Verificação visual via Playwright em `/admin/professionals`: abrir o modal Agenda de um profissional, adicionar e remover um horário.
