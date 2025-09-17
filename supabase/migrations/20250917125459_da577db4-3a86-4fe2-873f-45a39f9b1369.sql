-- Create the missing trigger to automatically activate new professionals
CREATE TRIGGER on_professional_created
  BEFORE INSERT ON public.profissionais
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_professional_status();

-- Activate the current user "Mohhamed" who should be active
UPDATE public.profissionais 
SET ativo = true 
WHERE user_email = 'mohhamed.mhmd@gmail.com' AND ativo = false;

-- Activate any other professionals who were created but not activated due to missing trigger
UPDATE public.profissionais 
SET ativo = true 
WHERE ativo = false 
AND profile_id IS NOT NULL 
AND profile_id IN (
  SELECT id FROM public.profiles WHERE tipo_usuario = 'profissional'
);