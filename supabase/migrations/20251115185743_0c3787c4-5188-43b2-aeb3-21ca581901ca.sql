-- =====================================================
-- FASE 1: Adicionar campos de permissão em educational_institutions
-- =====================================================

ALTER TABLE public.educational_institutions
  ADD COLUMN can_manage_users BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN can_manage_coupons BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN can_manage_professionals BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.educational_institutions.can_manage_users IS 
  'Permite que admins da instituição gerenciem (criar/editar/remover) usuários vinculados';

COMMENT ON COLUMN public.educational_institutions.can_manage_coupons IS 
  'Permite que admins da instituição gerenciem cupons institucionais';

COMMENT ON COLUMN public.educational_institutions.can_manage_professionals IS 
  'Permite que admins da instituição gerenciem profissionais vinculados';

-- =====================================================
-- FASE 2: Criar função SECURITY DEFINER para verificar permissões
-- =====================================================

CREATE OR REPLACE FUNCTION public.institution_has_permission(
  _user_id uuid,
  _institution_id uuid,
  _permission_type text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _has_permission boolean := false;
  _is_admin boolean := false;
BEGIN
  -- 1. Verificar se usuário é admin da instituição
  SELECT EXISTS(
    SELECT 1 FROM institution_users
    WHERE user_id = _user_id
      AND institution_id = _institution_id
      AND role = 'admin'
      AND is_active = true
  ) INTO _is_admin;

  -- Se não é admin, retorna false
  IF NOT _is_admin THEN
    RETURN false;
  END IF;

  -- 2. Verificar se instituição tem a permissão específica
  CASE _permission_type
    WHEN 'manage_users' THEN
      SELECT can_manage_users FROM educational_institutions
      WHERE id = _institution_id INTO _has_permission;
    
    WHEN 'manage_coupons' THEN
      SELECT can_manage_coupons FROM educational_institutions
      WHERE id = _institution_id INTO _has_permission;
    
    WHEN 'manage_professionals' THEN
      SELECT can_manage_professionals FROM educational_institutions
      WHERE id = _institution_id INTO _has_permission;
    
    ELSE
      RETURN false;
  END CASE;

  RETURN COALESCE(_has_permission, false);
END;
$$;

COMMENT ON FUNCTION public.institution_has_permission IS
  'Verifica se usuário é admin de instituição E se instituição tem permissão específica';

-- =====================================================
-- FASE 3: Atualizar RLS Policies
-- =====================================================

-- ===== 3.1: Policies de institution_coupons =====

DROP POLICY IF EXISTS "Institution admins can create their coupons" ON public.institution_coupons;
DROP POLICY IF EXISTS "Institution admins can update their coupons" ON public.institution_coupons;
DROP POLICY IF EXISTS "Institution admins can delete their coupons" ON public.institution_coupons;
DROP POLICY IF EXISTS "Institution admins can view their coupons" ON public.institution_coupons;

CREATE POLICY "Institution admins can view their coupons"
ON public.institution_coupons FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR user_belongs_to_institution(auth.uid(), institution_id)
);

CREATE POLICY "Institution admins can create coupons if authorized"
ON public.institution_coupons FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR institution_has_permission(auth.uid(), institution_id, 'manage_coupons')
);

CREATE POLICY "Institution admins can update coupons if authorized"
ON public.institution_coupons FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR institution_has_permission(auth.uid(), institution_id, 'manage_coupons')
);

CREATE POLICY "Institution admins can delete coupons if authorized"
ON public.institution_coupons FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR institution_has_permission(auth.uid(), institution_id, 'manage_coupons')
);

-- ===== 3.2: Policies de institution_users =====

DROP POLICY IF EXISTS "users_manage_own_institution_links" ON public.institution_users;

CREATE POLICY "Institution admins can view users"
ON public.institution_users FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR user_belongs_to_institution(auth.uid(), institution_id)
);

CREATE POLICY "Institution admins can insert users if authorized"
ON public.institution_users FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR institution_has_permission(auth.uid(), institution_id, 'manage_users')
);

CREATE POLICY "Institution admins can update users if authorized"
ON public.institution_users FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR institution_has_permission(auth.uid(), institution_id, 'manage_users')
);

CREATE POLICY "Institution admins can delete users if authorized"
ON public.institution_users FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR institution_has_permission(auth.uid(), institution_id, 'manage_users')
);

-- ===== 3.3: Policies de professional_institutions =====

-- Manter política de visualização para profissionais
-- Apenas ajustar políticas de modificação

CREATE POLICY "Institution admins can view professionals"
ON public.professional_institutions FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR user_belongs_to_institution(auth.uid(), institution_id)
  OR user_is_professional(auth.uid(), professional_id)
);

CREATE POLICY "Institution admins can insert professionals if authorized"
ON public.professional_institutions FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR institution_has_permission(auth.uid(), institution_id, 'manage_professionals')
);

CREATE POLICY "Institution admins can update professionals if authorized"
ON public.professional_institutions FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR institution_has_permission(auth.uid(), institution_id, 'manage_professionals')
);

CREATE POLICY "Institution admins can delete professionals if authorized"
ON public.professional_institutions FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR institution_has_permission(auth.uid(), institution_id, 'manage_professionals')
);