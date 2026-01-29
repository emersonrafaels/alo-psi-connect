-- Add footer and feature logo columns to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS footer_logo_url text,
ADD COLUMN IF NOT EXISTS footer_logo_url_dark text,
ADD COLUMN IF NOT EXISTS feature_logo_url text,
ADD COLUMN IF NOT EXISTS feature_logo_url_dark text;

-- Add comments explaining usage
COMMENT ON COLUMN tenants.footer_logo_url IS 'Logo for footer in light mode. Falls back to logo_url if not set.';
COMMENT ON COLUMN tenants.footer_logo_url_dark IS 'Logo for footer in dark mode. Falls back to logo_url_dark if not set.';
COMMENT ON COLUMN tenants.feature_logo_url IS 'Logo for features (blog, group sessions, etc.) in light mode. Falls back to logo_url if not set.';
COMMENT ON COLUMN tenants.feature_logo_url_dark IS 'Logo for features in dark mode. Falls back to logo_url_dark if not set.';