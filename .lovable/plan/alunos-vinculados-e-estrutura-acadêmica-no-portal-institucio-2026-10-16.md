# Alunos vinculados e estrutura acadêmica no Portal Institucional

## O que muda para a instituição
1. Nova aba **Alunos** no Portal Institucional, levando à página de alunos vinculados (já existente, ampliada).
2. Nova área **Estrutura acadêmica**, onde a instituição:
   - Escolhe o modelo de hierarquia:
     - Unidade > Curso > Turno > Turma (completa)
     - Curso > Turno > Turma
     - Turno > Turma
     - Somente Turma
   - Cadastra, edita e remove os itens de cada nível (ex.: Unidade "Campus Brotas" > Curso "Medicina" > Turno "Manhã" > Turma "2026.1-A").
3. Na lista de alunos:
   - Cada cartão mostra o caminho atribuído (ex.: "Medicina › Manhã › Turma A").
   - Botão **Vincular** abre um seletor em cascata seguindo apenas os níveis ativos.
   - Seleção de vários alunos para vincular em lote.
   - Filtros por cada nível ativo, e exportação CSV com essas colunas.
4. Alunos continuam aparecendo apenas como "Aluno #N" (anonimização obrigatória mantida).

## Regras
- Um aluno pertence a no máximo uma turma por instituição; o caminho completo deriva da turma.
- Cada item só pode ser criado dentro do nível pai ativo (turma dentro de turno, etc.).
- Trocar o modelo de hierarquia é permitido; itens de níveis desativados ficam ocultos (não apagados) e os vínculos dos alunos são preservados pela turma.
- Somente administradores daquela instituição (e admins da Rede Bem-Estar) podem ver/editar a estrutura e os vínculos.

## Detalhes técnicos
- Migration:
  - `educational_institutions.academic_hierarchy_levels text[]` (padrão `{unit,course,shift,class}`).
  - `institution_academic_units` (id, institution_id, parent_id nullable, level enum-like text `unit|course|shift|class`, name, sort_order, timestamps). Validação por trigger: o pai deve ter o nível imediatamente anterior dentre os ativos.
  - `patient_institution_placements` (patient_id, institution_id, class_unit_id, unique(patient_id, institution_id)).
  - GRANTs para authenticated/service_role, RLS usando `user_has_institution_access` / `is_admin`.
- Hook `useAcademicStructure(institutionId)` (árvore, CRUD, modelo) e `useStudentPlacements`.
- Componentes: `AcademicStructureManager` (configuração + árvore editável), `PlacementSelect` (cascata), extensão de `InstitutionStudents.tsx` com filtros, seleção múltipla e coluna de caminho.
- Aba "Alunos" em `InstitutionPortal.tsx` apontando para `/portal-institucional/alunos` (tenant-aware); página ganha abas "Alunos" e "Estrutura acadêmica".
- Teste unitário da regra de hierarquia (níveis ativos x pai permitido).
