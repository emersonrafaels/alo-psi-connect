ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'pt' CHECK (preferred_language IN ('pt','en','es'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_reminders boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_reminder_at timestamptz;

CREATE OR REPLACE FUNCTION public.care_request_on_diary_signal() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_patient uuid; v_inst uuid; v_demo boolean;
BEGIN
  IF NEW.risk_level IS DISTINCT FROM 'critical' THEN RETURN NEW; END IF;
  SELECT pa.id, pi.institution_id, coalesce(ei.is_demo,false) INTO v_patient, v_inst, v_demo
  FROM pacientes pa JOIN profiles pr ON pr.id = pa.profile_id
  JOIN patient_institutions pi ON pi.patient_id = pa.id
  LEFT JOIN educational_institutions ei ON ei.id = pi.institution_id
  WHERE pr.user_id = NEW.user_id ORDER BY pi.created_at DESC LIMIT 1;
  IF v_patient IS NULL THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM care_requests WHERE patient_id = v_patient AND institution_id = v_inst
     AND outcome = 'em_andamento' AND requested_at > now() - interval '30 days') THEN RETURN NEW; END IF;
  INSERT INTO care_requests(patient_id, institution_id, origin, is_synthetic) VALUES (v_patient, v_inst, 'diario', v_demo);
  RETURN NEW;
EXCEPTION WHEN others THEN RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS mood_analysis_care_request ON public.mood_entry_analyses;
CREATE TRIGGER mood_analysis_care_request AFTER INSERT OR UPDATE OF risk_level ON public.mood_entry_analyses
FOR EACH ROW EXECUTE FUNCTION public.care_request_on_diary_signal();