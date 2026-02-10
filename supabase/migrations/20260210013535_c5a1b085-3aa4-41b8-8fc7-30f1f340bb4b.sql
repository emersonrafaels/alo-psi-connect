ALTER TABLE group_sessions DROP CONSTRAINT group_sessions_status_check;
ALTER TABLE group_sessions ADD CONSTRAINT group_sessions_status_check 
  CHECK (status = ANY (ARRAY['draft', 'pending_approval', 'scheduled', 'live', 'completed', 'cancelled']));