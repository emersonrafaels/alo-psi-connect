ALTER TABLE public.care_requests ADD COLUMN IF NOT EXISTS message text, ADD COLUMN IF NOT EXISTS identified boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS thread_id uuid;

CREATE OR REPLACE FUNCTION public.open_care_request(p_origin text, p_message text, p_identified boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id uuid;
BEGIN
  v_id := public.open_care_request(p_origin);
  IF v_id IS NOT NULL AND (nullif(trim(coalesce(p_message,'')),'') IS NOT NULL OR p_identified) THEN
    UPDATE care_requests SET message = left(nullif(trim(p_message),''),1000), identified = coalesce(p_identified,false), updated_at = now() WHERE id = v_id;
  END IF;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.open_care_request(text, text, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.open_care_request(text, text, boolean) TO authenticated, service_role;