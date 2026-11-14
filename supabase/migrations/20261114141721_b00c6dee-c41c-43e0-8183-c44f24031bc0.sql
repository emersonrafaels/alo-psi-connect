CREATE OR REPLACE FUNCTION public.enforce_appointment_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_base numeric;
  v_code text;
  v_tenant uuid;
  v_valid boolean;
  v_final numeric;
BEGIN
  -- Back-end jobs (service role / no end-user session), admins and clinical staff keep full control.
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
    RETURN NEW;
  END IF;

  -- UPDATE by a patient or professional: financial and ownership fields stay as they were.
  NEW.valor := OLD.valor;
  NEW.coupon_id := OLD.coupon_id;
  NEW.payment_status := OLD.payment_status;
  NEW.user_id := OLD.user_id;
  NEW.professional_id := OLD.professional_id;
  NEW.mercado_pago_preference_id := OLD.mercado_pago_preference_id;
  NEW.stripe_session_id := OLD.stripe_session_id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_appointment_pricing() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_appointment_pricing ON public.agendamentos;
CREATE TRIGGER enforce_appointment_pricing
BEFORE INSERT OR UPDATE ON public.agendamentos
FOR EACH ROW EXECUTE FUNCTION public.enforce_appointment_pricing();