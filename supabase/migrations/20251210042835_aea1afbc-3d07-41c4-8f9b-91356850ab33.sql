-- 1. Update UniFOA logo with valid URL
UPDATE educational_institutions 
SET logo_url = 'https://unifoa.edu.br/wp-content/uploads/2023/03/logo-unifoa.png'
WHERE id = '33b11baa-2679-4673-a72e-b705c76c73f1';

-- 2. Create function to get profile_ids of students linked to institution admin's institutions
CREATE OR REPLACE FUNCTION get_mood_entries_profile_ids_for_institution_admin(_user_id uuid)
RETURNS TABLE(profile_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT pac.profile_id
  FROM patient_institutions pi
  JOIN pacientes pac ON pi.patient_id = pac.id
  WHERE pi.institution_id IN (
    SELECT iu.institution_id
    FROM institution_users iu
    WHERE iu.user_id = _user_id
    AND iu.is_active = true
  );
$$;

-- 3. Create RLS policy for institution admins to view student mood entries
CREATE POLICY "institution_admins_view_student_mood_entries"
ON mood_entries
FOR SELECT
TO authenticated
USING (
  profile_id IN (
    SELECT get_mood_entries_profile_ids_for_institution_admin(auth.uid())
  )
);