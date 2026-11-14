CREATE OR REPLACE FUNCTION public.enforce_coupon_usage_amounts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_appt record;
  v_base numeric;
BEGIN
  IF v_uid IS NULL OR coalesce(auth.role(), '') = 'service_role' OR public.is_admin(v_uid) THEN
    RETURN NEW;
  END IF;
  SELECT a.user_id, a.coupon_id, a.valor, a.professional_id INTO v_appt
  FROM public.agendamentos a WHERE a.id = NEW.appointment_id;
  IF v_appt IS NULL OR v_appt.user_id IS DISTINCT FROM v_uid OR v_appt.coupon_id IS DISTINCT FROM NEW.coupon_id THEN
    RAISE EXCEPTION 'Uso de cupom inválido para esta consulta' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM public.coupon_usage cu WHERE cu.appointment_id = NEW.appointment_id) THEN
    RAISE EXCEPTION 'Uso de cupom já registrado' USING ERRCODE = '23505';
  END IF;
  SELECT preco_consulta INTO v_base FROM public.profissionais WHERE id = v_appt.professional_id;
  NEW.user_id := v_uid;
  NEW.final_amount := coalesce(v_appt.valor, 0);
  NEW.original_amount := coalesce(v_base, v_appt.valor, 0);
  NEW.discount_amount := greatest(NEW.original_amount - NEW.final_amount, 0);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.bump_coupon_usage_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  UPDATE public.institution_coupons
     SET current_usage_count = coalesce(current_usage_count, 0) + 1
   WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_coupon_usage_amounts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_coupon_usage_count() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_coupon_usage_amounts ON public.coupon_usage;
CREATE TRIGGER enforce_coupon_usage_amounts BEFORE INSERT ON public.coupon_usage
  FOR EACH ROW EXECUTE FUNCTION public.enforce_coupon_usage_amounts();
DROP TRIGGER IF EXISTS bump_coupon_usage_count ON public.coupon_usage;
CREATE TRIGGER bump_coupon_usage_count AFTER INSERT ON public.coupon_usage
  FOR EACH ROW EXECUTE FUNCTION public.bump_coupon_usage_count();

CREATE OR REPLACE FUNCTION public.enforce_group_registration_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_free boolean;
BEGIN
  IF v_uid IS NULL OR coalesce(auth.role(), '') = 'service_role' OR public.is_admin(v_uid) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    SELECT (coalesce(is_free, true) OR coalesce(price, 0) <= 0) INTO v_free FROM public.group_sessions WHERE id = NEW.session_id;
    NEW.payment_status := CASE WHEN coalesce(v_free, true) THEN 'free' ELSE 'pending' END;
  ELSE
    NEW.payment_status := OLD.payment_status;
    NEW.user_id := OLD.user_id;
    NEW.session_id := OLD.session_id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.enforce_group_registration_payment() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS enforce_group_registration_payment ON public.group_session_registrations;
CREATE TRIGGER enforce_group_registration_payment BEFORE INSERT OR UPDATE ON public.group_session_registrations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_group_registration_payment();