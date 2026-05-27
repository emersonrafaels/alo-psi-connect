CREATE OR REPLACE FUNCTION public.has_patient_full_view_access(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value jsonb;
  v_list jsonb;
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  IF has_role(_user_id, 'admin'::app_role) OR has_role(_user_id, 'super_admin'::app_role) THEN
    RETURN true;
  END IF;

  SELECT value INTO v_value
  FROM public.system_configurations
  WHERE category = 'admin_access'
    AND key = 'patient_full_view_allowed_users'
    AND tenant_id IS NULL
  LIMIT 1;

  IF v_value IS NULL THEN
    RETURN false;
  END IF;

  -- Value may be stored as a JSON string containing an array, or as a JSON array directly
  IF jsonb_typeof(v_value) = 'string' THEN
    BEGIN
      v_list := (v_value #>> '{}')::jsonb;
    EXCEPTION WHEN OTHERS THEN
      RETURN false;
    END;
  ELSE
    v_list := v_value;
  END IF;

  IF jsonb_typeof(v_list) <> 'array' THEN
    RETURN false;
  END IF;

  RETURN v_list ? _user_id::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_patient_full_view_access(uuid) TO authenticated;