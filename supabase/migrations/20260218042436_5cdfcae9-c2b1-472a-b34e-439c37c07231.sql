CREATE POLICY "Institution admins can manage their notes"
ON public.institution_notes
FOR ALL
USING (
  institution_id IN (
    SELECT iu.institution_id FROM institution_users iu
    WHERE iu.user_id = auth.uid() AND iu.is_active = true
  )
)
WITH CHECK (
  institution_id IN (
    SELECT iu.institution_id FROM institution_users iu
    WHERE iu.user_id = auth.uid() AND iu.is_active = true
  )
);