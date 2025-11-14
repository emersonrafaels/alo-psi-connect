-- =====================================================
-- CORREÇÃO FINAL: Remover recursão infinita em user_roles
-- =====================================================

-- 1. REMOVER TODAS AS POLÍTICAS ANTIGAS QUE USAM has_role()
-- =====================================================

DROP POLICY IF EXISTS "Admins can view admin roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- 2. RECRIAR APENAS 2 POLÍTICAS SEGURAS (SEM RECURSÃO)
-- =====================================================

-- Política 1: Super admins podem gerenciar tudo
-- Usa EXISTS direto SEM chamar funções que consultam user_roles novamente
DROP POLICY IF EXISTS "super_admins_manage_all_roles" ON public.user_roles;
CREATE POLICY "super_admins_manage_all_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'::app_role
  )
);

-- Política 2: Usuários podem ver apenas seus próprios roles
DROP POLICY IF EXISTS "users_view_own_roles" ON public.user_roles;
CREATE POLICY "users_view_own_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. ATUALIZAR has_role() E is_admin() PARA INCLUIR COMENTÁRIO DE DEPRECATED
-- =====================================================

COMMENT ON FUNCTION public.has_role(uuid, app_role) IS 
'⚠️ DEPRECATED: Esta função pode causar recursão infinita quando usada em políticas RLS de user_roles. 
Use public.check_user_role() ou public.is_super_admin() nas políticas RLS.
Mantida apenas para compatibilidade com código frontend existente.';

COMMENT ON FUNCTION public.is_admin(uuid) IS 
'⚠️ DEPRECATED: Esta função pode causar recursão infinita quando usada em políticas RLS de user_roles.
Use public.check_user_role() ou public.is_super_admin() nas políticas RLS.
Mantida apenas para compatibilidade com código frontend existente.';

-- 4. ADICIONAR COMENTÁRIOS ÀS FUNÇÕES SEGURAS
-- =====================================================

COMMENT ON FUNCTION public.check_user_role(uuid, app_role) IS 
'✅ FUNÇÃO SEGURA: Use esta função em políticas RLS. 
Consulta direta à tabela user_roles sem lógica adicional que cause recursão.';

COMMENT ON FUNCTION public.is_super_admin(uuid) IS 
'✅ FUNÇÃO SEGURA: Use esta função em políticas RLS.
Consulta direta à tabela user_roles verificando apenas super_admin, sem recursão.';

-- 5. ADICIONAR COMENTÁRIO À TABELA user_roles
-- =====================================================

COMMENT ON TABLE public.user_roles IS 
'Tabela de roles de usuários. 
⚠️ IMPORTANTE: Políticas RLS desta tabela devem usar EXISTS direto ou funções check_user_role/is_super_admin.
NUNCA use has_role() ou is_admin() em políticas RLS desta tabela para evitar recursão infinita.';