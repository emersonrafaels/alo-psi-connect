-- =====================================================
-- CORREÇÃO: Substituir is_super_admin() por EXISTS direto
-- Evita recursão infinita em pacientes e patient_institutions
-- =====================================================

-- ============================================================
-- TABELA: pacientes
-- ============================================================

-- 1. REMOVER políticas antigas que usam is_super_admin()
DROP POLICY IF EXISTS "super_admins_can_select_patients" ON public.pacientes;
DROP POLICY IF EXISTS "super_admins_can_update_patients" ON public.pacientes;
DROP POLICY IF EXISTS "super_admins_can_delete_patients" ON public.pacientes;
DROP POLICY IF EXISTS "super_admins_can_insert_patients" ON public.pacientes;

-- 2. CRIAR políticas com EXISTS direto (SEM FUNÇÃO)
CREATE POLICY "super_admins_select_patients" ON public.pacientes
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  )
);

CREATE POLICY "super_admins_insert_patients" ON public.pacientes
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  )
);

CREATE POLICY "super_admins_update_patients" ON public.pacientes
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  )
);

CREATE POLICY "super_admins_delete_patients" ON public.pacientes
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  )
);

-- ============================================================
-- TABELA: patient_institutions
-- ============================================================

-- 1. REMOVER políticas antigas que usam is_super_admin()
DROP POLICY IF EXISTS "super_admins_can_select_patient_institutions" ON public.patient_institutions;
DROP POLICY IF EXISTS "super_admins_can_update_patient_institutions" ON public.patient_institutions;
DROP POLICY IF EXISTS "super_admins_can_delete_patient_institutions" ON public.patient_institutions;
DROP POLICY IF EXISTS "super_admins_can_insert_patient_institutions" ON public.patient_institutions;

-- 2. CRIAR políticas com EXISTS direto (SEM FUNÇÃO)
CREATE POLICY "super_admins_select_patient_institutions" ON public.patient_institutions
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  )
);

CREATE POLICY "super_admins_insert_patient_institutions" ON public.patient_institutions
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  )
);

CREATE POLICY "super_admins_update_patient_institutions" ON public.patient_institutions
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  )
);

CREATE POLICY "super_admins_delete_patient_institutions" ON public.patient_institutions
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  )
);

-- ============================================================
-- COMENTÁRIOS EXPLICATIVOS
-- ============================================================

COMMENT ON TABLE public.pacientes IS 
'Tabela de pacientes.
✅ Políticas RLS usam EXISTS direto (sem funções intermediárias)
✅ Super admins têm acesso total via EXISTS na tabela user_roles';

COMMENT ON TABLE public.patient_institutions IS 
'Tabela de vínculo paciente-instituição.
✅ Políticas RLS usam EXISTS direto (sem funções intermediárias)
✅ Super admins têm acesso total via EXISTS na tabela user_roles';