
-- 1. Drop policies that wrongly granted public access under "service role" labels
DROP POLICY IF EXISTS "Allow edge functions to manage tokens" ON public.email_confirmation_tokens;
DROP POLICY IF EXISTS "Service role full access on emergency contacts" ON public.patient_emergency_contacts;
DROP POLICY IF EXISTS "Service role can manage registration attempts" ON public.professional_registration_attempts;

-- 2. Hide author email of comments from anonymous viewers
REVOKE SELECT (author_email) ON public.comments FROM anon;

-- 3. Hide sensitive professional fields from anonymous viewers
REVOKE SELECT (cpf, banco, agencia, conta, pix, tipo_conta) ON public.profissionais FROM anon;
