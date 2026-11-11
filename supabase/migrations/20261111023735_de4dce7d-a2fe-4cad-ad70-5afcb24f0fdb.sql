-- Admin RBE inherits admin power through has_role / is_admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR (_role = 'admin'::app_role AND role = 'admin_rbe'::app_role))
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT CASE
    WHEN _user_id IS NULL THEN false
    WHEN _user_id = auth.uid() OR auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role IN ('admin','super_admin','admin_rbe')
    ) THEN EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = _user_id
        AND role IN ('admin','super_admin','moderator','admin_rbe')
    )
    ELSE false
  END
$$;

-- Technical admin = real admin/super_admin only (excludes Admin RBE)
CREATE OR REPLACE FUNCTION public.is_technical_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','super_admin'))
$$;

CREATE OR REPLACE FUNCTION public.is_clinical_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'clinical_coordinator')
$$;
REVOKE EXECUTE ON FUNCTION public.is_technical_admin(uuid), public.is_clinical_staff(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_technical_admin(uuid), public.is_clinical_staff(uuid) TO authenticated, service_role;

-- Technical areas: only real admins write
DROP POLICY IF EXISTS "Admins manage email settings" ON public.email_settings;
CREATE POLICY "Admins manage email settings" ON public.email_settings FOR ALL TO authenticated
  USING (public.is_technical_admin(auth.uid())) WITH CHECK (public.is_technical_admin(auth.uid()));
DROP POLICY IF EXISTS "translations admin write" ON public.translations;
CREATE POLICY "translations admin write" ON public.translations FOR ALL TO authenticated
  USING (public.is_technical_admin(auth.uid())) WITH CHECK (public.is_technical_admin(auth.uid()));
DROP POLICY IF EXISTS "glossary admin write" ON public.translation_glossary;
CREATE POLICY "glossary admin write" ON public.translation_glossary FOR ALL TO authenticated
  USING (public.is_technical_admin(auth.uid())) WITH CHECK (public.is_technical_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can manage their tenant configs" ON public.system_configurations;
CREATE POLICY "Admins can manage their tenant configs" ON public.system_configurations FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR (public.is_technical_admin(auth.uid()) AND (tenant_id = get_current_tenant_id() OR tenant_id IS NULL)))
  WITH CHECK (public.is_super_admin(auth.uid()) OR (public.is_technical_admin(auth.uid()) AND tenant_id = get_current_tenant_id()));

-- Clinical coordination + Admin RBE count as members of every institution
CREATE OR REPLACE FUNCTION public.user_belongs_to_institution(_user_id uuid, _institution_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.institution_users WHERE user_id = _user_id AND institution_id = _institution_id AND is_active = true)
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('clinical_coordinator','admin_rbe'))
$$;
CREATE OR REPLACE FUNCTION public.user_has_institution_access(_user_id uuid, _institution_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.institution_users iu JOIN public.user_roles ur ON ur.user_id = iu.user_id
    WHERE iu.user_id = _user_id AND iu.institution_id = _institution_id AND iu.is_active = true AND ur.role = 'institution_admin'
  ) OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('clinical_coordinator','admin_rbe'))
$$;

-- Clinical coordination: student health data across all institutions
CREATE POLICY "Clinical staff manage triage" ON public.student_triage FOR ALL TO authenticated
  USING (public.is_clinical_staff(auth.uid())) WITH CHECK (public.is_clinical_staff(auth.uid()));
CREATE POLICY "Clinical staff manage triage notes" ON public.student_triage_notes FOR ALL TO authenticated
  USING (public.is_clinical_staff(auth.uid())) WITH CHECK (public.is_clinical_staff(auth.uid()));
CREATE POLICY "Clinical staff manage critical terms" ON public.triage_critical_terms FOR ALL TO authenticated
  USING (public.is_clinical_staff(auth.uid())) WITH CHECK (public.is_clinical_staff(auth.uid()));
CREATE POLICY "Clinical staff read mood entries" ON public.mood_entries FOR SELECT TO authenticated USING (public.is_clinical_staff(auth.uid()));
CREATE POLICY "Clinical staff read mood analyses" ON public.mood_entry_analyses FOR SELECT TO authenticated USING (public.is_clinical_staff(auth.uid()));
CREATE POLICY "Clinical staff read scale responses" ON public.emotional_scale_responses FOR SELECT TO authenticated USING (public.is_clinical_staff(auth.uid()));
CREATE POLICY "Clinical staff read permanence" ON public.permanence_responses FOR SELECT TO authenticated USING (public.is_clinical_staff(auth.uid()));
CREATE POLICY "Clinical staff read patient links" ON public.patient_institutions FOR SELECT TO authenticated USING (public.is_clinical_staff(auth.uid()));
CREATE POLICY "Clinical staff read patients" ON public.pacientes FOR SELECT TO authenticated USING (public.is_clinical_staff(auth.uid()));
CREATE POLICY "Clinical staff read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_clinical_staff(auth.uid()));
CREATE POLICY "Clinical staff read appointments" ON public.agendamentos FOR SELECT TO authenticated USING (public.is_clinical_staff(auth.uid()));
CREATE POLICY "Clinical staff update appointments" ON public.agendamentos FOR UPDATE TO authenticated USING (public.is_clinical_staff(auth.uid())) WITH CHECK (public.is_clinical_staff(auth.uid()));
CREATE POLICY "Clinical staff read institutions" ON public.educational_institutions FOR SELECT TO authenticated USING (public.is_clinical_staff(auth.uid()));