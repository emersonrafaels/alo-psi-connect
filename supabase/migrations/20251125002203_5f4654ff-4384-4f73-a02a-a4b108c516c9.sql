-- Create RLS policy for institution admins to view appointments of their students
CREATE POLICY "Institution admins can view students appointments"
ON agendamentos
FOR SELECT
TO public
USING (
  user_id IN (
    SELECT pr.user_id
    FROM patient_institutions pi
    INNER JOIN pacientes p ON pi.patient_id = p.id
    INNER JOIN profiles pr ON p.profile_id = pr.id
    WHERE pi.institution_id IN (
      SELECT iu.institution_id
      FROM institution_users iu
      WHERE iu.user_id = auth.uid()
        AND iu.is_active = true
    )
  )
);

-- Create RLS policy for institution admins to view coupon usage of their students
CREATE POLICY "Institution admins can view students coupon usage"
ON coupon_usage
FOR SELECT
TO public
USING (
  user_id IN (
    SELECT pr.user_id
    FROM patient_institutions pi
    INNER JOIN pacientes p ON pi.patient_id = p.id
    INNER JOIN profiles pr ON p.profile_id = pr.id
    WHERE pi.institution_id IN (
      SELECT iu.institution_id
      FROM institution_users iu
      WHERE iu.user_id = auth.uid()
        AND iu.is_active = true
    )
  )
);