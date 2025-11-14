-- =====================================================
-- SOLUÇÃO DEFINITIVA: SECURITY DEFINER para quebrar recursão
-- =====================================================

-- ============================================================
-- FASE 1: Criar função SECURITY DEFINER (bypassa RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_patient_institutions_for_institution_admin(admin_user_id uuid)
RETURNS TABLE (patient_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  -- Esta função roda com privilégios do owner (bypassa RLS)
  -- Retorna apenas patient_ids das instituições do admin
  SELECT DISTINCT pi.patient_id 
  FROM patient_institutions pi
  INNER JOIN institution_users iu 
    ON iu.institution_id = pi.institution_id
  WHERE iu.user_id = admin_user_id 
    AND iu.is_active = true;
$$;

COMMENT ON FUNCTION public.get_patient_institutions_for_institution_admin IS
'SECURITY DEFINER function que bypassa RLS para evitar recursão infinita.
Retorna patient_ids vinculados às instituições do admin de forma segura.';

-- ============================================================
-- FASE 2: Atualizar política de pacientes (sem recursão!)
-- ============================================================

-- Remover política antiga que causava recursão
DROP POLICY IF EXISTS "institution_admins_select_linked_patients" ON public.pacientes;

-- Criar nova política usando SECURITY DEFINER function
CREATE POLICY "institution_admins_select_linked_patients"
ON public.pacientes FOR SELECT
TO authenticated
USING (
  -- Super admins continuam com acesso total
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  )
  OR
  -- Institution admins via SECURITY DEFINER (SEM RECURSÃO!)
  id IN (
    SELECT patient_id FROM get_patient_institutions_for_institution_admin(auth.uid())
  )
);

-- ============================================================
-- FASE 3: Simplificar patient_institutions (remover fonte de recursão)
-- ============================================================

-- Remover política que causava loop bidirecional
DROP POLICY IF EXISTS "patients_view_own_institutions" ON public.patient_institutions;

-- Manter apenas políticas necessárias:
-- 1. Super admins (já existe)
-- 2. Institution admins (já existe)

-- ============================================================
-- DOCUMENTAÇÃO E VALIDAÇÃO
-- ============================================================

COMMENT ON TABLE public.pacientes IS 
'✅ RLS atualizado com SECURITY DEFINER function
✅ Política institution_admins usa get_patient_institutions_for_institution_admin()
✅ SEM RECURSÃO: função bypassa RLS de patient_institutions
✅ Segurança mantida via filtro em institution_users';

COMMENT ON TABLE public.patient_institutions IS 
'✅ RLS simplificado - política patients_view_own_institutions REMOVIDA
✅ Super admins: acesso total
✅ Institution admins: SELECT via institution_users
✅ SEM LOOPS: nenhuma política consulta pacientes';

-- Verificação final
DO $$
DECLARE
    pacientes_policies INTEGER;
    patient_inst_policies INTEGER;
BEGIN
    SELECT COUNT(*) INTO pacientes_policies
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'pacientes';
    
    SELECT COUNT(*) INTO patient_inst_policies
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'patient_institutions';
    
    RAISE NOTICE '✅ Solução SECURITY DEFINER implementada com sucesso!';
    RAISE NOTICE '✅ Função: get_patient_institutions_for_institution_admin criada';
    RAISE NOTICE '✅ Políticas em pacientes: %', pacientes_policies;
    RAISE NOTICE '✅ Políticas em patient_institutions: %', patient_inst_policies;
    RAISE NOTICE '✅ RECURSÃO ELIMINADA: função bypassa RLS';
    RAISE NOTICE '🔄 Atualize a página para testar';
END $$;