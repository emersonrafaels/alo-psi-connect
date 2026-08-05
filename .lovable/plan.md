# Acesso ao Buddy dos alunos no Portal Institucional

Permitir que o admin da Rede Bem-Estar libere, instituição por instituição, quais usuários institucionais podem ver o Buddy de quais alunos. Tudo desabilitado por padrão.

## Como vai funcionar

**No painel admin (Portal Institucional → nova aba "Acesso ao Buddy")**
- Seleciona-se a instituição (seletor que já existe na página).
- Duas listas com caixas de seleção:
  - **Usuários institucionais** — quem pode ver o Buddy (vindos dos usuários vinculados àquela instituição).
  - **Alunos** — de quais alunos o Buddy fica visível (vindos dos alunos vinculados àquela instituição).
- Busca em cada lista, contadores ("3 de 12 liberados") e ações "selecionar todos" / "limpar".
- Salvar aplica só na instituição selecionada. Nada é liberado por padrão.

**No Portal Institucional (visão da instituição)**
- A aba "Buddy dos Alunos" só aparece se o usuário logado estiver na lista de usuários liberados daquela instituição e existir pelo menos um aluno liberado.
- Lista apenas os alunos liberados. Ao abrir um aluno, um painel somente leitura mostra o Buddy dele: retrato (como se sente, o que acalma, o que quer melhorar, sono/estresse/energia), narrativa e forças/pontos de atenção dos insights, temas detectados e recomendações.
- Nada é editável e nada é gerado pela instituição — é leitura do que o aluno já tem.
- A regra de anonimização de nomes de alunos já existente continua valendo na listagem.

## Detalhes técnicos

Migração (Supabase):
- `institution_buddy_viewers` (`institution_id`, `user_id`, `granted_by`, timestamps, unique institution+user).
- `institution_buddy_students` (`institution_id`, `patient_id`, `granted_by`, timestamps, unique institution+patient).
- GRANTs para `authenticated` (select) e `service_role` (all); insert/update/delete restritos a admin/super_admin via `has_role`; select liberado ao próprio usuário liberado e a admins.
- Função `security definer` `institution_buddy_allowed_patients(_user_id, _institution_id)` retornando os `patient_id` permitidos (cruza as duas tabelas), usada nas policies de leitura de `buddy_portraits` e `buddy_insights` para o usuário institucional liberado.

Frontend:
- `src/hooks/useInstitutionBuddyAccess.tsx` — leitura/gravação das duas listas (admin) e checagem `canViewStudentBuddy` + lista de alunos permitidos (portal).
- `src/components/admin/InstitutionBuddyAccessTab.tsx` — a aba de configuração, montada em `src/pages/admin/AdminInstitutionPortal.tsx`.
- `src/components/institution/StudentBuddyPanel.tsx` — lista de alunos liberados + painel de leitura do Buddy, montado como nova aba em `src/pages/InstitutionPortal.tsx` (renderizada condicionalmente).
- Reaproveita os tipos e queries de `src/hooks/useBuddy.tsx` (`buddy_portraits`, `buddy_insights`) com o `patient_id` do aluno.
