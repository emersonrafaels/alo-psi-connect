-- Remove old coupon fields that were replaced by target_audience and professional_scope
ALTER TABLE institution_coupons 
DROP COLUMN IF EXISTS applies_to,
DROP COLUMN IF EXISTS applicable_professional_ids,
DROP COLUMN IF EXISTS applicable_specialties;