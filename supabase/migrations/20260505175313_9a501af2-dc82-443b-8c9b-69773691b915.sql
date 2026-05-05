DO $$
DECLARE
  v_medcos uuid := '3a9ae5ec-50a9-4674-b808-7735e5f0afb5';
  v_rbe uuid := '472db0ac-0f45-4998-97da-490bc579efb1';
BEGIN
  -- profiles
  UPDATE public.profiles SET tenant_id = v_rbe WHERE tenant_id = v_medcos OR tenant_id IS NULL;

  -- mood_entries (incluindo NULL)
  UPDATE public.mood_entries SET tenant_id = v_rbe WHERE tenant_id = v_medcos OR tenant_id IS NULL;

  -- mood_insight_analyses
  UPDATE public.mood_insight_analyses SET tenant_id = v_rbe WHERE tenant_id = v_medcos OR tenant_id IS NULL;

  -- whatsapp tables
  UPDATE public.whatsapp_profile_links SET tenant_id = v_rbe WHERE tenant_id = v_medcos OR tenant_id IS NULL;
  UPDATE public.whatsapp_conversation_state SET tenant_id = v_rbe WHERE tenant_id = v_medcos OR tenant_id IS NULL;
  UPDATE public.whatsapp_reminder_preferences SET tenant_id = v_rbe WHERE tenant_id = v_medcos OR tenant_id IS NULL;
  UPDATE public.whatsapp_specialist_requests SET tenant_id = v_rbe WHERE tenant_id = v_medcos OR tenant_id IS NULL;

  -- pacientes
  UPDATE public.pacientes SET tenant_id = v_rbe WHERE tenant_id = v_medcos OR tenant_id IS NULL;

  -- user_tenants: remove medcos rows where user already has rbe; otherwise convert to rbe
  DELETE FROM public.user_tenants ut
  WHERE ut.tenant_id = v_medcos
    AND EXISTS (
      SELECT 1 FROM public.user_tenants ut2
      WHERE ut2.user_id = ut.user_id AND ut2.tenant_id = v_rbe
    );

  UPDATE public.user_tenants
    SET tenant_id = v_rbe, is_primary = true
    WHERE tenant_id = v_medcos;
END $$;