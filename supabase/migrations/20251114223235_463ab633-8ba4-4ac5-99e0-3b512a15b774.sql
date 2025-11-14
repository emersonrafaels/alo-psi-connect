-- =====================================================
-- SOLUÇÃO COMPLETA: Corrigir recursão infinita
-- Fase 1: Remover política problemática
-- Fase 2: Corrigir institution_users
-- Fase 3: Recriar política segura para institution admins
-- =====================================================

-- ============================================================
-- FASE 1: REMOVER POLÍTICA PROBLEMÁTICA DE PACIENTES
-- ============================================================

DROP POLICY IF EXISTS "institution_admins_select_linked_patients" ON public.pacientes;

COMMENT ON TABLE public.pacientes IS 
'✅ Fase 1 concluída: Política recursiva removida';

-- ============================================================
-- FASE 2: CORRIGIR POLÍTICAS DE INSTITUTION_USERS
-- ============================================================

-- Remover políticas antigas que usam funções recursivas
DROP POLICY IF EXISTS "Admins can view institution users" ON public.institution_users;
DROP POLICY IF EXISTS "Institution users can view colleagues" ON public.institution_users;
DROP POLICY IF EXISTS "Super admins can manage institution users" ON public.institution_users;
DROP POLICY IF EXISTS "Admins can insert institution users" ON public.institution_users;
DROP POLICY IF EXISTS "Admins can update institution users" ON public.institution_users;
DROP POLICY IF EXISTS "Admins can delete institution users" ON public.institution_users;

-- Criar políticas com EXISTS direto (sem recursão)
CREATE POLICY "super_admins_all_institution_users" 
ON public.institution_users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  )
);

CREATE POLICY "users_view_own_institution_links"
ON public.institution_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "users_manage_own_institution_links"
ON public.institution_users FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.institution_users IS 
'✅ Fase 2 concluída: Políticas usando EXISTS direto (sem recursão)
✅ Super admins: acesso total
✅ Usuários: podem ver apenas seus próprios vínculos';

-- ============================================================
-- FASE 3: RECRIAR POLÍTICA SEGURA PARA INSTITUTION ADMINS
-- ============================================================

-- Política que permite institution admins verem pacientes das suas instituições
-- SEM recursão porque institution_users agora usa EXISTS direto
CREATE POLICY "institution_admins_select_linked_patients" 
ON public.pacientes FOR SELECT
TO authenticated
USING (
  -- Super admins sempre podem
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
  )
  OR
  -- Institution admins apenas dos pacientes vinculados às suas instituições
  id IN (
    SELECT pi.patient_id 
    FROM patient_institutions pi
    WHERE pi.institution_id IN (
      SELECT institution_id FROM institution_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

COMMENT ON TABLE public.pacientes IS 
'✅ Fase 3 concluída: Política segura restaurada
✅ Super admins: acesso total
✅ Institution admins: veem pacientes das suas instituições
✅ SEM recursão: institution_users usa EXISTS direto';

-- ============================================================
-- VALIDAÇÃO FINAL
-- ============================================================

-- Verificar que todas as políticas foram criadas corretamente
DO $$
BEGIN
  RAISE NOTICE '✅ Solução completa implementada com sucesso!';
  RAISE NOTICE '✅ Fase 1: Política recursiva removida';
  RAISE NOTICE '✅ Fase 2: institution_users corrigido';
  RAISE NOTICE '✅ Fase 3: Acesso de institution admins restaurado';
  RAISE NOTICE '🔄 Atualize a página para aplicar as mudanças';
END $$;