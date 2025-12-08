-- Função para buscar profile_ids de profissionais vinculados às instituições do admin
CREATE OR REPLACE FUNCTION get_professional_profile_ids_for_institution_admin(_user_id uuid)
RETURNS TABLE(profile_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT pr.profile_id
  FROM profissionais pr
  INNER JOIN professional_institutions pi ON pi.professional_id = pr.id
  INNER JOIN institution_users iu ON iu.institution_id = pi.institution_id
  WHERE iu.user_id = _user_id
    AND iu.is_active = true
    AND pi.is_active = true;
$$;

-- Política RLS para admins institucionais verem profiles de profissionais vinculados
CREATE POLICY "institution_admins_view_professional_profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT profile_id 
    FROM get_professional_profile_ids_for_institution_admin(auth.uid())
  )
);