# Corrigir erro ao adicionar horário pelo painel admin

## Causa confirmada
O erro `insert or update on table "profissionais_sessoes" violates foreign key constraint "profissionais_sessoes_user_id_fkey"` ocorre porque:

- A coluna `profissionais_sessoes.user_id` tem chave estrangeira para `profissionais.user_id` (o ID numérico do usuário no WordPress), **não** para `profissionais.id` (a chave primária da linha).
- No perfil do profissional (`ProfessionalProfile.tsx`), o `ScheduleManager` já recebe corretamente `professionalData?.user_id`.
- Na nova tela admin (`Professionals.tsx` e `EditProfessionalModal.tsx`), o componente recebeu `professional.id` — valor que não existe em `profissionais.user_id`, causando a violação da chave estrangeira.

## Mudanças

### 1. `src/pages/admin/Professionals.tsx`
- Adicionar `user_id: number` à interface `Professional` (o campo já vem no `select('*')`, só falta tipar).
- No modal de agenda, trocar `<ScheduleManager professionalId={scheduleProfessional.id} />` por `professionalId={scheduleProfessional.user_id}`.

### 2. `src/components/admin/EditProfessionalModal.tsx`
- Na aba Agenda, trocar `<ScheduleManager professionalId={professional.id} />` por `professionalId={professional.user_id}` (ajustando a tipagem do prop se necessário).

### 3. Proteção extra
- Se `user_id` estiver ausente, desabilitar o formulário de adicionar horário e mostrar aviso, em vez de tentar salvar e falhar.

## Detalhes técnicos
- Nenhuma migração de banco: a regra de acesso para admins já existe; o problema é apenas o identificador errado enviado no insert.
- `ScheduleManager` continua filtrando/inserindo por `user_id`, agora com o valor correto.

## Validação
- `bunx tsgo --noEmit -p tsconfig.app.json`.
- Teste manual em `/admin/professionals`: abrir "Agenda" de um profissional, adicionar e remover um horário sem erro.
