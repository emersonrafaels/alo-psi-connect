-- Add new columns for advanced coupon targeting
ALTER TABLE institution_coupons
ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'institution_students', 'other_patients')),
ADD COLUMN IF NOT EXISTS target_audience_user_ids UUID[],
ADD COLUMN IF NOT EXISTS professional_scope TEXT DEFAULT 'all_tenant' CHECK (professional_scope IN ('all_tenant', 'institution_professionals')),
ADD COLUMN IF NOT EXISTS professional_scope_ids INTEGER[];

-- Add comments for documentation
COMMENT ON COLUMN institution_coupons.target_audience IS 'Defines which patient group can use the coupon: all patients, only institution students, or only non-enrolled patients';
COMMENT ON COLUMN institution_coupons.target_audience_user_ids IS 'When target_audience is specific, stores the list of allowed user IDs';
COMMENT ON COLUMN institution_coupons.professional_scope IS 'Defines which professionals the coupon applies to: all tenant professionals or only institution-linked professionals';
COMMENT ON COLUMN institution_coupons.professional_scope_ids IS 'When professional_scope is specific, stores the list of professional IDs the coupon applies to';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_institution_coupons_target_audience ON institution_coupons(target_audience);
CREATE INDEX IF NOT EXISTS idx_institution_coupons_professional_scope ON institution_coupons(professional_scope);
CREATE INDEX IF NOT EXISTS idx_institution_coupons_target_audience_user_ids ON institution_coupons USING GIN(target_audience_user_ids);
CREATE INDEX IF NOT EXISTS idx_institution_coupons_professional_scope_ids ON institution_coupons USING GIN(professional_scope_ids);