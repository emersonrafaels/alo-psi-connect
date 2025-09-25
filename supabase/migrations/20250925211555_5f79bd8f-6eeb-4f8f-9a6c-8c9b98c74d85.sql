-- Add column to track Google Calendar scope
ALTER TABLE profiles ADD COLUMN google_calendar_scope TEXT DEFAULT NULL;