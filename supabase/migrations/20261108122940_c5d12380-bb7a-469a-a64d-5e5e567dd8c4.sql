DROP POLICY IF EXISTS "Plano de apoios é legível" ON public.institution_support_plan;
CREATE POLICY "Plano de apoios legível por usuários logados" ON public.institution_support_plan FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Configurações do plano são legíveis" ON public.institution_support_settings;
CREATE POLICY "Configurações do plano legíveis por usuários logados" ON public.institution_support_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Anyone can insert education" ON public.professional_education;
CREATE POLICY "Professionals add own education" ON public.professional_education FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin(auth.uid()) OR professional_id IN (
    SELECT p.id FROM public.profissionais p JOIN public.profiles pr ON pr.id = p.profile_id WHERE pr.user_id = auth.uid()
  )
);