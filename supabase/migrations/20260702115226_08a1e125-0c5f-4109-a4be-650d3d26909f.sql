
CREATE TABLE public.buddy_privacy_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  consent_registered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.buddy_privacy_preferences TO authenticated;
GRANT ALL ON public.buddy_privacy_preferences TO service_role;

ALTER TABLE public.buddy_privacy_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can select own privacy prefs"
  ON public.buddy_privacy_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Owner can insert own privacy prefs"
  ON public.buddy_privacy_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can update own privacy prefs"
  ON public.buddy_privacy_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can delete own privacy prefs"
  ON public.buddy_privacy_preferences FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Linked professionals can read student privacy prefs"
  ON public.buddy_privacy_preferences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.agendamentos a
      JOIN public.profissionais pr ON pr.id = a.professional_id
      JOIN public.profiles prof ON prof.id = pr.profile_id
      WHERE a.user_id = buddy_privacy_preferences.user_id
        AND prof.user_id = auth.uid()
        AND a.status NOT IN ('cancelado','rejeitado')
    )
  );

CREATE TRIGGER trg_buddy_privacy_preferences_updated_at
  BEFORE UPDATE ON public.buddy_privacy_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
