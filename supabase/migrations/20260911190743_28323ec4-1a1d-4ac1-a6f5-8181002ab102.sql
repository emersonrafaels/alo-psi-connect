CREATE OR REPLACE FUNCTION public.get_support_plan_counts()
RETURNS TABLE(support_key text, total bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.support_key, count(*)::bigint
  FROM public.support_plan_items p
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
     OR public.has_role(auth.uid(), 'super_admin'::app_role)
  GROUP BY p.support_key
$$;

GRANT EXECUTE ON FUNCTION public.get_support_plan_counts() TO authenticated;