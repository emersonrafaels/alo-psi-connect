-- Create table for professional unavailability/blocked times
CREATE TABLE public.professional_unavailability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id INTEGER NOT NULL,
  date DATE NOT NULL,
  start_time TIME WITHOUT TIME ZONE,
  end_time TIME WITHOUT TIME ZONE,
  all_day BOOLEAN NOT NULL DEFAULT false,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.professional_unavailability ENABLE ROW LEVEL SECURITY;

-- Create policies for professional unavailability
CREATE POLICY "Admins can manage all unavailability" 
ON public.professional_unavailability 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Professionals can manage their own unavailability" 
ON public.professional_unavailability 
FOR ALL 
USING (professional_id IN (
  SELECT p.user_id 
  FROM profissionais p 
  JOIN profiles pr ON p.profile_id = pr.id 
  WHERE pr.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_professional_unavailability_updated_at
BEFORE UPDATE ON public.professional_unavailability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_professional_unavailability_professional_id ON public.professional_unavailability(professional_id);
CREATE INDEX idx_professional_unavailability_date ON public.professional_unavailability(date);