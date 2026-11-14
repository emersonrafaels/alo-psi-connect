-- 1) Institution RPCs: require caller access to the institution
ALTER FUNCTION public.get_institution_alerts(uuid) RENAME TO _get_institution_alerts_impl;
ALTER FUNCTION public._get_institution_alerts_impl(uuid) SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public._get_institution_alerts_impl(uuid) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.get_institution_alerts(p_institution_id uuid)
RETURNS TABLE(severity text, message text, count integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT (public.user_belongs_to_institution(auth.uid(), p_institution_id) OR public.is_admin(auth.uid())) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY SELECT * FROM public._get_institution_alerts_impl(p_institution_id);
END $$;
REVOKE ALL ON FUNCTION public.get_institution_alerts(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_institution_alerts(uuid) TO authenticated;

ALTER FUNCTION public.get_institution_growth_metrics(uuid) RENAME TO _get_institution_growth_metrics_impl;
REVOKE ALL ON FUNCTION public._get_institution_growth_metrics_impl(uuid) FROM PUBLIC, anon, authenticated;
CREATE FUNCTION public.get_institution_growth_metrics(p_institution_id uuid)
RETURNS TABLE(month text, professionals_added bigint, students_enrolled bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT (public.user_belongs_to_institution(auth.uid(), p_institution_id) OR public.is_admin(auth.uid())) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY SELECT * FROM public._get_institution_growth_metrics_impl(p_institution_id);
END $$;
REVOKE ALL ON FUNCTION public.get_institution_growth_metrics(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_institution_growth_metrics(uuid) TO authenticated;

ALTER FUNCTION public.get_institution_engagement_metrics(uuid) RENAME TO _get_institution_engagement_metrics_impl;
ALTER FUNCTION public._get_institution_engagement_metrics_impl(uuid) SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public._get_institution_engagement_metrics_impl(uuid) FROM PUBLIC, anon, authenticated;
CREATE FUNCTION public.get_institution_engagement_metrics(p_institution_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT (public.user_belongs_to_institution(auth.uid(), p_institution_id) OR public.is_admin(auth.uid())) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN public._get_institution_engagement_metrics_impl(p_institution_id);
END $$;
REVOKE ALL ON FUNCTION public.get_institution_engagement_metrics(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_institution_engagement_metrics(uuid) TO authenticated;

-- 2) Radar diagnostics: only active institution members
DROP POLICY IF EXISTS "Institution users view own radar" ON public.institution_radar_diagnostics;
CREATE POLICY "Institution users view own radar" ON public.institution_radar_diagnostics FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.institution_users iu WHERE iu.institution_id = institution_radar_diagnostics.institution_id AND iu.user_id = auth.uid() AND iu.is_active = true));
DROP POLICY IF EXISTS "Institution users insert own radar" ON public.institution_radar_diagnostics;
CREATE POLICY "Institution users insert own radar" ON public.institution_radar_diagnostics FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.institution_users iu WHERE iu.institution_id = institution_radar_diagnostics.institution_id AND iu.user_id = auth.uid() AND iu.is_active = true));
DROP POLICY IF EXISTS "Institution users update own radar" ON public.institution_radar_diagnostics;
CREATE POLICY "Institution users update own radar" ON public.institution_radar_diagnostics FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.institution_users iu WHERE iu.institution_id = institution_radar_diagnostics.institution_id AND iu.user_id = auth.uid() AND iu.is_active = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.institution_users iu WHERE iu.institution_id = institution_radar_diagnostics.institution_id AND iu.user_id = auth.uid() AND iu.is_active = true));

-- 3) AI insights quota: only the server (service role) writes usage
DROP POLICY IF EXISTS "Users can insert their own insights usage" ON public.ai_insights_usage;
DROP POLICY IF EXISTS "Users can update their own insights usage" ON public.ai_insights_usage;

-- 4) AI chat: written only by the ai-assistant function; users read only their own
DROP POLICY IF EXISTS "Anyone can create chat sessions" ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "Anyone can create chat messages" ON public.ai_chat_messages;
DROP POLICY IF EXISTS "Users can update their own chat sessions" ON public.ai_chat_sessions;
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.ai_chat_sessions;
CREATE POLICY "Users can view their own chat sessions" ON public.ai_chat_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view messages from their sessions" ON public.ai_chat_messages;
CREATE POLICY "Users can view messages from their sessions" ON public.ai_chat_messages FOR SELECT TO authenticated
USING (session_id IN (SELECT s.session_id FROM public.ai_chat_sessions s WHERE s.user_id = auth.uid()));

-- 5) Writes done by service-role functions only
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "Anyone can insert theme suggestions" ON public.group_session_theme_suggestions;
DROP POLICY IF EXISTS "Anyone can insert view tracking" ON public.blog_post_views_tracking;
DROP POLICY IF EXISTS "System can create revisions" ON public.blog_post_revisions;
CREATE POLICY "Authors and admins create revisions" ON public.blog_post_revisions FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()) OR post_id IN (SELECT b.id FROM public.blog_posts b WHERE b.author_id = auth.uid()));

-- 6) Client-side event inserts must carry the caller's own identity
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.group_session_analytics;
CREATE POLICY "Insert own session analytics" ON public.group_session_analytics FOR INSERT TO anon, authenticated
WITH CHECK ((auth.uid() IS NULL AND user_id IS NULL) OR user_id = auth.uid());
DROP POLICY IF EXISTS "Anyone can insert checkout" ON public.praticas_checkouts;
CREATE POLICY "Insert own checkout" ON public.praticas_checkouts FOR INSERT TO anon, authenticated
WITH CHECK ((auth.uid() IS NULL AND user_id IS NULL) OR user_id = auth.uid());
DROP POLICY IF EXISTS "Anyone can insert tracking events" ON public.user_booking_tracking;
CREATE POLICY "Insert own tracking events" ON public.user_booking_tracking FOR INSERT TO anon, authenticated
WITH CHECK ((auth.uid() IS NULL AND user_id IS NULL) OR user_id = auth.uid());

-- 7) Reads limited to the owner / intended audience
DROP POLICY IF EXISTS "Anyone can view comment likes" ON public.comment_likes;
CREATE POLICY "Users view own comment likes" ON public.comment_likes FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view education" ON public.professional_education;
CREATE POLICY "Owners and admins view education" ON public.professional_education FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()) OR professional_id IN (SELECT p.id FROM public.profissionais p JOIN public.profiles pr ON pr.id = p.profile_id WHERE pr.user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can view professional tenants" ON public.professional_tenants;
CREATE POLICY "Public can view active professional tenants" ON public.professional_tenants FOR SELECT TO anon, authenticated
USING (professional_id IN (SELECT p.id FROM public.profissionais p WHERE p.ativo = true));

DROP POLICY IF EXISTS "Plano de apoios legível por usuários logados" ON public.institution_support_plan;
CREATE POLICY "Plano de apoios legível pela instituição" ON public.institution_support_plan FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()) OR public.user_belongs_to_institution(auth.uid(), institution_id)
  OR EXISTS (SELECT 1 FROM public.patient_institutions pi WHERE pi.institution_id = institution_support_plan.institution_id AND pi.patient_id = public.current_patient_id()));
DROP POLICY IF EXISTS "Configurações do plano legíveis por usuários logados" ON public.institution_support_settings;
CREATE POLICY "Configurações do plano legíveis pela instituição" ON public.institution_support_settings FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()) OR public.user_belongs_to_institution(auth.uid(), institution_id)
  OR EXISTS (SELECT 1 FROM public.patient_institutions pi WHERE pi.institution_id = institution_support_settings.institution_id AND pi.patient_id = public.current_patient_id()));

-- 8) Comments: hide author email from public reads (column-level), keep it for admins via RPC-free server access
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Anyone can view approved comments" ON public.comments FOR SELECT TO anon, authenticated
USING (status = 'approved' OR auth.uid() = user_id OR public.is_admin(auth.uid()));
REVOKE SELECT ON public.comments FROM anon, authenticated;
GRANT SELECT (id, post_id, user_id, content, author_name, created_at, updated_at, parent_comment_id, likes_count, status, reported_count) ON public.comments TO anon, authenticated;