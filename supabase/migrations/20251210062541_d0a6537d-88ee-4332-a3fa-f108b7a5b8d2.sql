-- Criar policy para institution admins verem agendamentos dos profissionais vinculados à sua instituição
CREATE POLICY "Institution admins can view professionals appointments"
  ON agendamentos
  FOR SELECT
  TO authenticated
  USING (
    professional_id IN (
      SELECT pi.professional_id::integer
      FROM professional_institutions pi
      INNER JOIN institution_users iu ON iu.institution_id = pi.institution_id
      WHERE iu.user_id = auth.uid()
        AND iu.is_active = true
        AND pi.is_active = true
    )
  );