-- Add 'facilitator' role to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'facilitator';

-- Add columns to track approval workflow for group_sessions
ALTER TABLE group_sessions
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS review_notes text;