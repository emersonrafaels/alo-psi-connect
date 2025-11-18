-- Criar política RLS para permitir pacientes visualizarem seus próprios vínculos institucionais
CREATE POLICY "patients_view_own_institutions" 
ON patient_institutions
FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT p.id 
    FROM pacientes p
    INNER JOIN profiles pr ON p.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  )
);