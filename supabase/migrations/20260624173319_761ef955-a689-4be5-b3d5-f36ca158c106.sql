GRANT SELECT ON public.emotional_scales TO anon;
GRANT SELECT ON public.emotional_scale_items TO anon;

CREATE POLICY "Anyone reads active scales"
  ON public.emotional_scales
  FOR SELECT
  TO anon
  USING (active = true);

CREATE POLICY "Anyone reads scale items"
  ON public.emotional_scale_items
  FOR SELECT
  TO anon
  USING (true);