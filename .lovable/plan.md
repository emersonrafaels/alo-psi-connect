# Listagem completa de pacientes (página admin oculta)

## Objetivo
Criar uma página exclusiva para administradores selecionados, com visão completa de cada paciente: dados cadastrais, atividade da conta, histórico do diário emocional e encontros (passados e futuros).

## Controle de acesso
- Rota nova: `/admin/pacientes-completo` (URL "obscura", não linkada por padrão).
- Visibilidade controlada por **allow-list de user_ids**, gerenciada em `Admin → Configurações`.
- Armazenamento: nova chave em `system_configurations` (`category='admin_access'`, `key='patient_full_view_allowed_users'`, valor = array de UUIDs).
- Hook `usePatientFullViewAccess()` retorna `true` se o usuário é `super_admin` **ou** está na allow-list.
- O item de menu no `AdminSidebar` só aparece quando `usePatientFullViewAccess()` for `true`.
- A página em si também valida o acesso (defesa em profundidade) — redireciona caso contrário.
- No `Admin → Configurações` adicionar nova aba/seção **"Acesso à Lista Completa de Pacientes"** com busca de usuários (reutiliza `useAllUsers`) e botões adicionar/remover.

## Página: Lista de pacientes
Layout: tabela com busca/filtros no topo + drawer/modal de detalhes ao clicar numa linha.

**Colunas da tabela:**
- Nome, e-mail, telefone
- Data de nascimento / idade, gênero
- Cidade/UF (se disponível em profiles)
- Instituições vinculadas (badges)
- Conta criada em (`profiles.created_at`)
- Último login (`auth.users.last_sign_in_at` — via edge function service-role)
- Nº de entradas no diário (últimos 30d / total)
- Nº de encontros (próximos / passados)
- Última entrada do diário

**Filtros:** busca por nome/e-mail, instituição, faixa etária, faixa de "último login" (ativo/inativo), com diário sim/não.

**Exportação:** botão "Exportar CSV" do conjunto filtrado.

## Drawer de detalhes do paciente
Tabs:
1. **Perfil** — todos os campos de `profiles` + `pacientes` (cpf, raça, sexualidade, contatos de emergência, como conheceu, foto).
2. **Conta** — created_at, last_sign_in_at, confirmed_at, provedores, tenants vinculados.
3. **Instituições** — lista de `patient_institutions` com status e datas.
4. **Diário emocional** — histórico de `mood_entries` (gráfico simples + tabela com data, valores das emoções, observação) e `mood_entry_analyses` (risk_level, mensagem do buddy). Respeita criptografia atual (mostra somente se admin tem permissão de descriptografar — caso contrário, exibe resumo agregado).
5. **Encontros** — sessões em grupo: `group_session_registrations` (futuras destacadas no topo, passadas abaixo) + agendamentos 1:1 (`agendamentos`) — data, profissional, status.

## Backend
- **Migration**: nenhuma alteração de schema obrigatória. Apenas inserir a chave inicial vazia em `system_configurations` (`[]`).
- **Edge function** `admin-patients-overview`:
  - Verifica caller via `getUser()` + checa allow-list/super_admin no banco.
  - Usa service-role para combinar: profiles (tipo_usuario='paciente') + pacientes + last_sign_in_at de `auth.users` + contagens agregadas de mood_entries e encontros.
  - Retorna lista paginada (50/página) e endpoint `/detail/:patient_id` para o drawer.
- Justificativa: `last_sign_in_at` está em `auth.users` (não acessível pelo client), e centralizar a agregação evita N+1 no front.

## Arquivos a criar/editar
**Novos**
- `src/pages/admin/PatientsFullView.tsx`
- `src/components/admin/PatientFullViewDrawer.tsx`
- `src/components/admin/PatientFullViewAccessConfig.tsx` (gestão da allow-list)
- `src/hooks/usePatientFullViewAccess.tsx`
- `src/hooks/useAdminPatientsOverview.tsx`
- `supabase/functions/admin-patients-overview/index.ts`

**Editar**
- `src/App.tsx` — registrar rota.
- `src/components/admin/AdminSidebar.tsx` — item de menu condicional.
- `src/pages/admin/Configurations.tsx` — nova seção com `PatientFullViewAccessConfig`.

## Detalhes técnicos
- Permissão: super_admin sempre vê; usuários da allow-list (qualquer `tipo_usuario`) também veem.
- Página é renderizada via `AdminLayout` mas o `ProtectedRoute` interno chama `usePatientFullViewAccess` — sem ele, redireciona para `/admin`.
- Edge function lê a allow-list de `system_configurations`; o front nunca confia somente em flag local.
- Diário criptografado: se houver chave de descriptografia em uso (verificar `mood_entries` storage), exibir dados descriptografados apenas para `super_admin`; demais usuários da allow-list veem somente metadados (datas, risk_level, contagens) — confirma com o usuário se quiser comportamento diferente.

## Perguntas em aberto (posso assumir os defaults)
1. **Diário criptografado**: mostrar conteúdo bruto a todos da allow-list ou apenas super_admin? *(default: apenas super_admin vê bruto)*
2. **Exportar CSV**: liberado para todos da allow-list? *(default: sim)*
3. **URL**: `/admin/pacientes-completo` está ok? *(default: sim)*
