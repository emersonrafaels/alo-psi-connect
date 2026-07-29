CREATE TABLE public.radar_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  granted_by uuid,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.radar_access_grants TO authenticated;
GRANT ALL ON public.radar_access_grants TO service_role;

ALTER TABLE public.radar_access_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own radar grant"
ON public.radar_access_grants FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all radar grants"
ON public.radar_access_grants FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can create radar grants"
ON public.radar_access_grants FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can update radar grants"
ON public.radar_access_grants FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete radar grants"
ON public.radar_access_grants FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_radar_access_grants_updated_at
BEFORE UPDATE ON public.radar_access_grants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.has_radar_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE WHEN _user_id IS NULL THEN false ELSE (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id
        AND role IN ('admin'::app_role, 'super_admin'::app_role, 'institution_admin'::app_role, 'facilitator'::app_role)
    )
    OR EXISTS (
      SELECT 1 FROM public.radar_access_grants
      WHERE user_id = _user_id
    )
  ) END
$$;