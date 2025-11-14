-- ============================================
-- Correção de RLS para tabela pacientes
-- Remove políticas redundantes e simplifica lógica
-- ============================================

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Admins can update patients" ON pacientes;
DROP POLICY IF EXISTS "Admins can view all patients" ON pacientes;
DROP POLICY IF EXISTS "Institution admins can view linked patients" ON pacientes;
DROP POLICY IF EXISTS "Tenant isolation for patients" ON pacientes;
DROP POLICY IF EXISTS "Users can insert their own patient info" ON pacientes;
DROP POLICY IF EXISTS "Users can update their own patient info" ON pacientes;
DROP POLICY IF EXISTS "Users can view their own patient info" ON pacientes;

-- 2. Criar políticas simplificadas e sem recursão

-- SELECT: Admins podem ver todos os pacientes
CREATE POLICY "admins_select_all_patients"
ON pacientes FOR SELECT
USING (
  public.is_admin(auth.uid())
);

-- SELECT: Institution admins podem ver pacientes vinculados
CREATE POLICY "institution_admins_select_linked_patients"
ON pacientes FOR SELECT
USING (
  id IN (
    SELECT pit.patient_id
    FROM patient_institutions pit
    INNER JOIN institution_users iu ON iu.institution_id = pit.institution_id
    WHERE iu.user_id = auth.uid() 
      AND iu.is_active = true
  )
);

-- SELECT: Usuários podem ver seus próprios dados
CREATE POLICY "users_select_own_patient_data"
ON pacientes FOR SELECT
USING (
  profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- INSERT: Usuários podem criar seus próprios dados
CREATE POLICY "users_insert_own_patient_data"
ON pacientes FOR INSERT
WITH CHECK (
  profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- UPDATE: Admins podem atualizar qualquer paciente
CREATE POLICY "admins_update_all_patients"
ON pacientes FOR UPDATE
USING (
  public.is_admin(auth.uid())
);

-- UPDATE: Usuários podem atualizar seus próprios dados
CREATE POLICY "users_update_own_patient_data"
ON pacientes FOR UPDATE
USING (
  profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

-- DELETE: Apenas admins podem deletar
CREATE POLICY "admins_delete_patients"
ON pacientes FOR DELETE
USING (
  public.is_admin(auth.uid())
);