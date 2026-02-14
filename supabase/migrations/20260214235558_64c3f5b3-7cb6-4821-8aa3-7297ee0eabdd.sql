CREATE POLICY "Creators can update own editable sessions"
  ON group_sessions FOR UPDATE
  USING (
    auth.uid() = created_by 
    AND status IN ('pending_approval', 'scheduled')
  );