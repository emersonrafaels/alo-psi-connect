-- ============================================================================
-- PARTE 1: Criar funções Security Definer simplificadas (SEM recursão)
-- ============================================================================

-- Função simples para verificar se usuário tem um role específico
CREATE OR REPLACE FUNCTION public.check_user_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função específica para verificar se é super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'::app_role
  )
$$;

-- ============================================================================
-- PARTE 2: Remover políticas antigas que causam recursão
-- ============================================================================

-- Remover políticas antigas da tabela pacientes que usam is_admin()
DROP POLICY IF EXISTS "admins_delete_patients" ON public.pacientes;
DROP POLICY IF EXISTS "admins_select_all_patients" ON public.pacientes;
DROP POLICY IF EXISTS "admins_update_all_patients" ON public.pacientes;

-- Remover política antiga de super_admins_select_all_patients (se existir)
DROP POLICY IF EXISTS "super_admins_select_all_patients" ON public.pacientes;

-- Remover políticas antigas de user_roles que podem causar recursão
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- ============================================================================
-- PARTE 3: Criar novas políticas RLS sem recursão
-- ============================================================================

-- Políticas para tabela pacientes usando função simplificada
CREATE POLICY "super_admins_can_select_patients"
ON public.pacientes FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "super_admins_can_update_patients"
ON public.pacientes FOR UPDATE
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "super_admins_can_delete_patients"
ON public.pacientes FOR DELETE
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "super_admins_can_insert_patients"
ON public.pacientes FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));

-- Políticas para patient_institutions usando função simplificada
CREATE POLICY "super_admins_can_select_patient_institutions"
ON public.patient_institutions FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "super_admins_can_update_patient_institutions"
ON public.patient_institutions FOR UPDATE
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "super_admins_can_delete_patient_institutions"
ON public.patient_institutions FOR DELETE
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "super_admins_can_insert_patient_institutions"
ON public.patient_institutions FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));

-- Políticas para user_roles com verificação direta (sem usar funções)
CREATE POLICY "super_admins_manage_all_roles"
ON public.user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'::app_role
  )
);

-- Política para usuários verem seus próprios roles
CREATE POLICY "users_view_own_roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- ============================================================================
-- PARTE 4: Atualizar comentários das funções
-- ============================================================================

COMMENT ON FUNCTION public.check_user_role IS 'Simplified security definer function to check user roles without recursion';
COMMENT ON FUNCTION public.is_super_admin IS 'Simplified security definer function to check super_admin role without recursion';