ALTER TABLE public.student_triage
  ADD COLUMN IF NOT EXISTS resolution_type text,
  ADD COLUMN IF NOT EXISTS resolution_notes text,
  ADD COLUMN IF NOT EXISTS reopen_reason text,
  ADD COLUMN IF NOT EXISTS reopen_notes text,
  ADD COLUMN IF NOT EXISTS reopened_at timestamp with time zone;