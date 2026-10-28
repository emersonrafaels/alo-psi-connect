REVOKE ALL ON FUNCTION public.care_request_on_triage() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.care_request_on_paid() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_care_request() FROM PUBLIC, anon, authenticated;