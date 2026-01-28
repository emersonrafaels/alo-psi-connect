-- Add logo_url_dark column to tenants table for dark mode logo support
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS logo_url_dark TEXT;