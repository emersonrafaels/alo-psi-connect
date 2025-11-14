-- =====================================================
-- CORREÇÃO DEFINITIVA: patient_institutions RLS
-- Remove TODAS políticas antigas e cria versões seguras
-- =====================================================

-- ============================================================
-- FASE 1: REMOVER TODAS AS POLÍTICAS ANTIGAS
-- ============================================================

DROP POLICY IF EXISTS "Admins can manage all patient institutions" ON public.patient_institutions;
DROP POLICY IF EXISTS "Admins can view all patient institutions" ON public.patient_institutions;
DROP POLICY IF EXISTS "Institution admins can view their patients" ON public.patient_institutions;
DROP POLICY IF EXISTS "Patients can view their own institutions" ON public.patient_institutions;
DROP POLICY IF EXISTS "Super admins can view all patient institutions" ON public.patient_institutions;

-- Remover qualquer outra política que possa existir
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'patient_institutions'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.patient_institutions', pol.policyname);
    END LOOP;
END $$;

-- ============================================================
-- FASE 2: CRIAR POLÍTICAS SEGURAS (SEM RECURSÃO)
-- ============================================================

-- 1. Super Admins: Acesso total (usando EXISTS direto)
CREATE POLICY "super_admins_all_patient_institutions"
ON public.patient_institutions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  )
);

-- 2. Pacientes: Ver apenas seus próprios vínculos (consulta unidirecional)
CREATE POLICY "patients_view_own_institutions"
ON public.patient_institutions FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT id FROM pacientes 
    WHERE profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- 3. Institution Admins: Ver pacientes das suas instituições
CREATE POLICY "institution_admins_view_linked_patients"
ON public.patient_institutions FOR SELECT
TO authenticated
USING (
  institution_id IN (
    SELECT institution_id FROM institution_users
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- ============================================================
-- VALIDAÇÃO E DOCUMENTAÇÃO
-- ============================================================

COMMENT ON TABLE public.patient_institutions IS 
'✅ RLS Policies atualizado - SEM RECURSÃO
✅ Super admins: acesso total via EXISTS direto
✅ Pacientes: veem apenas seus vínculos (unidirecional)
✅ Institution admins: veem pacientes das suas instituições
✅ institution_users agora seguro (Fase 2 anterior)';

-- Verificação final
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'patient_institutions';
    
    RAISE NOTICE '✅ Correção definitiva de patient_institutions concluída!';
    RAISE NOTICE '✅ Total de políticas criadas: %', policy_count;
    RAISE NOTICE '✅ Sem recursão: todas as consultas são diretas';
    RAISE NOTICE '🔄 Atualize a página para aplicar as mudanças';
END $$;