-- Allow public read access to specific system configurations
CREATE POLICY "Public can read guest diary limit" 
ON public.system_configurations 
FOR SELECT 
USING (category = 'system' AND key = 'guest_diary_limit');