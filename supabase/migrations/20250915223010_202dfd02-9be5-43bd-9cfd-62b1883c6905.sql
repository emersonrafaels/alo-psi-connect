-- Create a policy to allow public read access to homepage configurations
CREATE POLICY "Allow public read access to homepage configurations" 
ON public.system_configurations 
FOR SELECT 
USING (category = 'homepage');