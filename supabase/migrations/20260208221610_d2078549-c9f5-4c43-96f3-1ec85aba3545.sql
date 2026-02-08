-- Create RLS policy for facilitators to create sessions with pending_approval status
CREATE POLICY "Facilitators can create pending sessions"
ON group_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'facilitator') AND
  status = 'pending_approval' AND
  created_by = auth.uid()
);

-- Facilitators can view their own sessions
CREATE POLICY "Facilitators can view own sessions"
ON group_sessions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'facilitator') AND
  created_by = auth.uid()
);

-- Facilitators can update their own pending sessions
CREATE POLICY "Facilitators can update own pending sessions"
ON group_sessions
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'facilitator') AND
  created_by = auth.uid() AND
  status = 'pending_approval'
);

-- Facilitators can delete their own pending sessions
CREATE POLICY "Facilitators can delete own pending sessions"
ON group_sessions
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'facilitator') AND
  created_by = auth.uid() AND
  status = 'pending_approval'
);