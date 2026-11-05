CREATE TABLE public.email_settings (
  email_key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  site_admin_receives boolean NOT NULL DEFAULT false,
  extra_recipients text[] NOT NULL DEFAULT '{}',
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_settings TO authenticated;
GRANT ALL ON public.email_settings TO service_role;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage email settings" ON public.email_settings FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER email_settings_updated BEFORE UPDATE ON public.email_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.email_settings (email_key, site_admin_receives, extra_recipients) VALUES ('_site_admin', true, ARRAY['redebemestar1@gmail.com']);