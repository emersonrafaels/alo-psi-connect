-- Add logo_url column to educational_institutions
ALTER TABLE educational_institutions 
ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL;

-- Create table for ignored uncatalogued institutions
CREATE TABLE IF NOT EXISTS ignored_uncatalogued_institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_name TEXT NOT NULL UNIQUE,
  patient_count INTEGER DEFAULT 0,
  first_mention TIMESTAMPTZ,
  last_mention TIMESTAMPTZ,
  ignored_at TIMESTAMPTZ DEFAULT NOW(),
  ignored_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ignored_uncatalogued_institutions ENABLE ROW LEVEL SECURITY;

-- Create policy for admins
CREATE POLICY "Admins can manage ignored institutions"
  ON ignored_uncatalogued_institutions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));