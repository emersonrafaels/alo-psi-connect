-- 1) Helper: may the current caller inspect data about _user_id?
CREATE OR REPLACE FUNCTION public._may_inspect_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT _user_id IS NOT NULL AND (
    _user_id = auth.uid()
    -- internal jobs / service role (no end-user JWT role)
    OR coalesce(auth.role(), '') NOT IN ('anon', 'authenticated')
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin'::app_role, 'super_admin'::app_role, 'admin_rbe'::app_role)
    )
  )
$$;
REVOKE ALL ON FUNCTION public._may_inspect_user(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._may_inspect_user(uuid) TO service_role;

-- 2) Role / relationship checks bound to the caller
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public._may_inspect_user(_user_id) AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR (_role = 'admin'::app_role AND role = 'admin_rbe'::app_role))
  )
$$;

CREATE OR REPLACE FUNCTION public.is_clinical_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public._may_inspect_user(_user_id)
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'clinical_coordinator')
$$;

CREATE OR REPLACE FUNCTION public.can_view_student_buddy(_user_id uuid, _patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public._may_inspect_user(_user_id) AND EXISTS (
    SELECT 1
    FROM public.institution_buddy_students s
    JOIN public.institution_buddy_viewers v ON v.institution_id = s.institution_id
    WHERE s.patient_id = _patient_id
      AND v.user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.institution_has_permission(_user_id uuid, _institution_id uuid, _permission_type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _has_permission boolean := false;
  _is_admin boolean := false;
BEGIN
  IF NOT public._may_inspect_user(_user_id) THEN
    RETURN false;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM institution_users
    WHERE user_id = _user_id
      AND institution_id = _institution_id
      AND role = 'admin'
      AND is_active = true
  ) INTO _is_admin;

  IF NOT _is_admin THEN
    RETURN false;
  END IF;

  CASE _permission_type
    WHEN 'manage_users' THEN
      SELECT can_manage_users FROM educational_institutions WHERE id = _institution_id INTO _has_permission;
    WHEN 'manage_coupons' THEN
      SELECT can_manage_coupons FROM educational_institutions WHERE id = _institution_id INTO _has_permission;
    WHEN 'manage_professionals' THEN
      SELECT can_manage_professionals FROM educational_institutions WHERE id = _institution_id INTO _has_permission;
    ELSE
      RETURN false;
  END CASE;

  RETURN COALESCE(_has_permission, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_institutions(_user_id uuid)
RETURNS TABLE(institution_id uuid, role text, tenant_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT iu.institution_id, iu.role, iu.tenant_id
  FROM public.institution_users iu
  WHERE iu.user_id = _user_id
    AND iu.is_active = true
    AND public._may_inspect_user(_user_id)
$$;

CREATE OR REPLACE FUNCTION public.get_student_profile_ids_for_institution_admin(_user_id uuid)
RETURNS TABLE(profile_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT p.profile_id
  FROM pacientes p
  INNER JOIN patient_institutions pi ON pi.patient_id = p.id
  INNER JOIN institution_users iu ON iu.institution_id = pi.institution_id
  WHERE iu.user_id = _user_id
    AND iu.is_active = true
    AND public._may_inspect_user(_user_id);
$$;

CREATE OR REPLACE FUNCTION public.get_professional_profile_ids_for_institution_admin(_user_id uuid)
RETURNS TABLE(profile_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT pr.profile_id
  FROM profissionais pr
  INNER JOIN professional_institutions pi ON pi.professional_id = pr.id
  INNER JOIN institution_users iu ON iu.institution_id = pi.institution_id
  WHERE iu.user_id = _user_id
    AND iu.is_active = true
    AND pi.is_active = true
    AND public._may_inspect_user(_user_id);
$$;

CREATE OR REPLACE FUNCTION public.get_mood_entries_profile_ids_for_institution_admin(_user_id uuid)
RETURNS TABLE(profile_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT pac.profile_id
  FROM patient_institutions pi
  JOIN pacientes pac ON pi.patient_id = pac.id
  WHERE public._may_inspect_user(_user_id)
    AND pi.institution_id IN (
      SELECT iu.institution_id FROM institution_users iu
      WHERE iu.user_id = _user_id AND iu.is_active = true
    );
$$;

CREATE OR REPLACE FUNCTION public.get_patient_institutions_for_institution_admin(admin_user_id uuid)
RETURNS TABLE(patient_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT pi.patient_id
  FROM patient_institutions pi
  INNER JOIN institution_users iu ON iu.institution_id = pi.institution_id
  WHERE iu.user_id = admin_user_id
    AND iu.is_active = true
    AND public._may_inspect_user(admin_user_id);
$$;

-- 3) Anonymous visitors don't need these at all (only used in signed-in policies or by the server)
REVOKE EXECUTE ON FUNCTION public.can_view_student_buddy(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_institutions(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_professional_profile_ids_for_institution_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_mood_entries_profile_ids_for_institution_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_patient_institutions_for_institution_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_clinical_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_student_buddy(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_institutions(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_professional_profile_ids_for_institution_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_mood_entries_profile_ids_for_institution_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_patient_institutions_for_institution_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_clinical_staff(uuid) TO authenticated, service_role;

-- 4) Server-only functions
REVOKE EXECUTE ON FUNCTION public.compute_iseu_score(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compute_iseu_score(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.increment_post_views(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_post_views(text) TO service_role;

-- 5) Appointments: patients can't confirm their own booking; only cancel
CREATE OR REPLACE FUNCTION public.enforce_appointment_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_base numeric;
  v_code text;
  v_tenant uuid;
  v_valid boolean;
  v_final numeric;
  v_is_professional boolean;
BEGIN
  IF v_uid IS NULL OR coalesce(auth.role(), '') = 'service_role'
     OR public.is_admin(v_uid) OR public.is_clinical_staff(v_uid) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT preco_consulta INTO v_base FROM public.profissionais WHERE id = NEW.professional_id;
    IF v_base IS NOT NULL THEN
      NEW.valor := v_base;
    END IF;

    IF NEW.coupon_id IS NOT NULL THEN
      SELECT code, tenant_id INTO v_code, v_tenant FROM public.institution_coupons WHERE id = NEW.coupon_id;
      IF v_code IS NULL THEN
        NEW.coupon_id := NULL;
      ELSE
        SELECT vc.is_valid, vc.final_amount INTO v_valid, v_final
        FROM public.validate_coupon(v_code, NEW.user_id, NEW.professional_id::bigint, coalesce(NEW.valor, 0), coalesce(v_tenant, NEW.tenant_id)) vc
        LIMIT 1;
        IF coalesce(v_valid, false) THEN
          NEW.valor := v_final;
        ELSE
          NEW.coupon_id := NULL;
        END IF;
      END IF;
    END IF;

    NEW.payment_status := 'pending_payment';
    NEW.status := 'pendente';
    RETURN NEW;
  END IF;

  NEW.valor := OLD.valor;
  NEW.coupon_id := OLD.coupon_id;
  NEW.payment_status := OLD.payment_status;
  NEW.user_id := OLD.user_id;
  NEW.professional_id := OLD.professional_id;
  NEW.mercado_pago_preference_id := OLD.mercado_pago_preference_id;
  NEW.stripe_session_id := OLD.stripe_session_id;

  SELECT EXISTS (
    SELECT 1 FROM public.profissionais p JOIN public.profiles pr ON pr.id = p.profile_id
    WHERE p.id = OLD.professional_id AND pr.user_id = v_uid
  ) INTO v_is_professional;

  -- Patients may only cancel; confirmation comes from payment or the professional.
  IF NOT v_is_professional AND NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'cancelado' THEN
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END;
$$;