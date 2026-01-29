-- Add separate switcher logo columns for tenants
-- These logos appear when THIS tenant is shown in the switcher button of OTHER tenants

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS switcher_logo_url TEXT,
ADD COLUMN IF NOT EXISTS switcher_logo_url_dark TEXT;

-- Add comments for clarity
COMMENT ON COLUMN public.tenants.switcher_logo_url IS 'Logo shown when this tenant appears in the switcher of other tenants (light mode)';
COMMENT ON COLUMN public.tenants.switcher_logo_url_dark IS 'Logo shown when this tenant appears in the switcher of other tenants (dark mode)';