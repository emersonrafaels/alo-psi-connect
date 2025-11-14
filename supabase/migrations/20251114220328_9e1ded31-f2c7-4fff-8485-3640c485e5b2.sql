-- =====================================================
-- CORREÇÃO DEFINITIVA: Remover recursão infinita em user_roles
-- =====================================================

-- 1. REMOVER POLÍTICA RECURSIVA
DROP POLICY IF EXISTS "super_admins_manage_all_roles" ON public.user_roles;

-- 2. MANTER APENAS POLÍTICA SELECT (NÃO RECURSIVA)
DROP POLICY IF EXISTS "users_view_own_roles" ON public.user_roles;
CREATE POLICY "users_view_own_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. PERMITIR INSERT/UPDATE/DELETE APENAS VIA SERVICE ROLE
-- (Edge functions usam service_role e bypassam RLS)
-- Não criamos políticas para INSERT/UPDATE/DELETE aqui,
-- pois elas devem ser feitas apenas via manage-user-roles edge function

-- 4. ADICIONAR COMENTÁRIO EXPLICATIVO
COMMENT ON TABLE public.user_roles IS 
'Tabela de roles de usuários.
⚠️ IMPORTANTE: 
- SELECT: usuários podem ver apenas seus próprios roles
- INSERT/UPDATE/DELETE: apenas via edge function manage-user-roles com service_role
- NUNCA adicione políticas RLS que consultem user_roles recursivamente';

-- 5. MARCAR FUNÇÕES PERIGOSAS COMO DEPRECATED
COMMENT ON FUNCTION public.has_role(uuid, app_role) IS 
'⚠️ DEPRECATED para uso em RLS: causa recursão infinita em user_roles.
Use apenas em código frontend. Para RLS, use EXISTS direto.';

COMMENT ON FUNCTION public.is_admin(uuid) IS 
'⚠️ DEPRECATED para uso em RLS: causa recursão infinita em user_roles.
Use apenas em código frontend. Para RLS, use EXISTS direto.';