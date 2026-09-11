CREATE OR REPLACE FUNCTION public.get_support_favorites_counts()
RETURNS TABLE(support_key text, total bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.support_key, count(*)::bigint
  FROM public.support_favorites f
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
     OR public.has_role(auth.uid(), 'super_admin'::app_role)
  GROUP BY f.support_key
$$;

CREATE OR REPLACE FUNCTION public.get_support_visits_counts()
RETURNS TABLE(support_key text, total bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.support_key, count(*)::bigint
  FROM public.support_visits v
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
     OR public.has_role(auth.uid(), 'super_admin'::app_role)
  GROUP BY v.support_key
$$;

GRANT EXECUTE ON FUNCTION public.get_support_favorites_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_support_visits_counts() TO authenticated;