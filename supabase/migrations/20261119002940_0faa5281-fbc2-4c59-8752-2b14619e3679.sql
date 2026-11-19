
ALTER POLICY "Clinical staff read patients" ON public.pacientes USING ((select public.is_clinical_staff((select auth.uid()))));
ALTER POLICY "institution_admins_select_linked_patients" ON public.pacientes USING (
  (select public.has_role((select auth.uid()), 'super_admin'::app_role))
  OR id IN (SELECT g.patient_id FROM public.get_patient_institutions_for_institution_admin((select auth.uid())) g(patient_id)));
ALTER POLICY "super_admins_select_patients" ON public.pacientes USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (select auth.uid()) AND role = 'super_admin'::app_role));
ALTER POLICY "users_select_own_patient_data" ON public.pacientes USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.uid())));

ALTER POLICY "Clinical staff read patient links" ON public.patient_institutions USING ((select public.is_clinical_staff((select auth.uid()))));
ALTER POLICY "institution_admins_view_linked_patients" ON public.patient_institutions USING (institution_id IN (SELECT iu.institution_id FROM public.institution_users iu WHERE iu.user_id = (select auth.uid()) AND iu.is_active = true));
ALTER POLICY "patients_view_own_institutions" ON public.patient_institutions USING (patient_id IN (SELECT p.id FROM public.pacientes p JOIN public.profiles pr ON p.profile_id = pr.id WHERE pr.user_id = (select auth.uid())));
ALTER POLICY "super_admins_all_patient_institutions" ON public.patient_institutions USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (select auth.uid()) AND role = 'super_admin'::app_role));

ALTER POLICY "Admins can view all profiles" ON public.profiles USING ((select public.is_admin((select auth.uid()))));
ALTER POLICY "Admins can view institution user profiles" ON public.profiles USING (
  (select public.has_role((select auth.uid()), 'super_admin'::app_role)) OR (select public.has_role((select auth.uid()), 'admin'::app_role))
  OR EXISTS (SELECT 1 FROM public.institution_users iu1 JOIN public.institution_users iu2 ON iu1.institution_id = iu2.institution_id
    WHERE iu1.user_id = (select auth.uid()) AND iu2.user_id = profiles.user_id AND iu1.is_active AND iu2.is_active));
ALTER POLICY "Clinical staff read profiles" ON public.profiles USING ((select public.is_clinical_staff((select auth.uid()))));
ALTER POLICY "Tenant isolation for profiles" ON public.profiles USING ((select public.is_admin((select auth.uid()))) OR (select auth.uid()) = user_id);
ALTER POLICY "Users can view their own profile" ON public.profiles USING ((select auth.uid()) = user_id);
ALTER POLICY "institution_admins_view_professional_profiles" ON public.profiles USING (id IN (SELECT g.profile_id FROM public.get_professional_profile_ids_for_institution_admin((select auth.uid())) g(profile_id)));
ALTER POLICY "institution_admins_view_student_profiles" ON public.profiles USING (id IN (SELECT g.profile_id FROM public.get_student_profile_ids_for_institution_admin((select auth.uid())) g(profile_id)));
ALTER POLICY "super_admins_select_all_profiles" ON public.profiles USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (select auth.uid()) AND role = 'super_admin'::app_role));

ALTER POLICY "Admins can view all mood entries" ON public.mood_entries USING ((select public.is_admin((select auth.uid()))));
ALTER POLICY "Clinical staff read mood entries" ON public.mood_entries USING ((select public.is_clinical_staff((select auth.uid()))));
ALTER POLICY "Users can view their own mood entries" ON public.mood_entries USING ((select auth.uid()) = user_id);
ALTER POLICY "institution_admins_view_student_mood_entries" ON public.mood_entries USING (profile_id IN (SELECT public.get_mood_entries_profile_ids_for_institution_admin((select auth.uid()))));

ALTER POLICY "Clinical staff read mood analyses" ON public.mood_entry_analyses USING ((select public.is_clinical_staff((select auth.uid()))));
ALTER POLICY "Super admins manage all mood analyses" ON public.mood_entry_analyses USING ((select public.has_role((select auth.uid()), 'super_admin'::app_role)));
ALTER POLICY "Users can view their own mood analyses" ON public.mood_entry_analyses USING ((select auth.uid()) = user_id);

ALTER POLICY "Admins can manage all triage records" ON public.student_triage USING ((select public.is_admin((select auth.uid()))));
ALTER POLICY "Clinical staff manage triage" ON public.student_triage USING ((select public.is_clinical_staff((select auth.uid()))));
ALTER POLICY "Institution admins can manage triage" ON public.student_triage USING (institution_id IN (SELECT iu.institution_id FROM public.institution_users iu WHERE iu.user_id = (select auth.uid()) AND iu.is_active = true));

CREATE INDEX IF NOT EXISTS idx_patient_institutions_inst_status ON public.patient_institutions (institution_id, enrollment_status, patient_id);
CREATE INDEX IF NOT EXISTS idx_student_triage_patient_created ON public.student_triage (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_placements_institution ON public.patient_institution_placements (institution_id);
