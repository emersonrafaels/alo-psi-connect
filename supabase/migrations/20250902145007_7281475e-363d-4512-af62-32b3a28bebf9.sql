-- Fix security issues: Enable RLS on existing tables
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais_sessoes ENABLE ROW LEVEL SECURITY;

-- Create policies for profissionais table
CREATE POLICY "Everyone can view active professionals" 
ON public.profissionais FOR SELECT 
USING (ativo = true);

CREATE POLICY "Professionals can update their own profile" 
ON public.profissionais FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

CREATE POLICY "Professionals can insert their own profile" 
ON public.profissionais FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id));

-- Create policies for profissionais_sessoes table
CREATE POLICY "Everyone can view sessions from active professionals" 
ON public.profissionais_sessoes FOR SELECT 
USING (user_id IN (SELECT user_id FROM public.profissionais WHERE ativo = true));

CREATE POLICY "Professionals can manage their own sessions" 
ON public.profissionais_sessoes FOR ALL 
USING (auth.uid() = (SELECT user_id FROM public.profissionais WHERE user_id = profissionais_sessoes.user_id));