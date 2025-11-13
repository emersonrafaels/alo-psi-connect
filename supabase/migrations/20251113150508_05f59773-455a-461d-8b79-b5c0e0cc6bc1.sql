-- Add new coupon fields for target audience and professional scope
ALTER TABLE institution_coupons 
ADD COLUMN IF NOT EXISTS target_audience text DEFAULT 'all' CHECK (target_audience IN ('all', 'institution_students', 'other_patients')),
ADD COLUMN IF NOT EXISTS target_audience_user_ids uuid[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS professional_scope text DEFAULT 'all_tenant' CHECK (professional_scope IN ('all_tenant', 'institution_professionals')),
ADD COLUMN IF NOT EXISTS professional_scope_ids bigint[] DEFAULT NULL;