-- Create agendamentos table for storing appointment bookings
CREATE TABLE public.agendamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  data_consulta DATE NOT NULL,
  horario TIME NOT NULL,
  valor DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'realizado')),
  nome_paciente TEXT NOT NULL,
  email_paciente TEXT NOT NULL,
  telefone_paciente TEXT NOT NULL,
  observacoes TEXT,
  stripe_session_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Create policies for agendamentos
CREATE POLICY "Users can view their own appointments" 
ON public.agendamentos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appointments" 
ON public.agendamentos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" 
ON public.agendamentos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Professionals can view their appointments" 
ON public.agendamentos 
FOR SELECT 
USING (professional_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Professionals can update their appointments" 
ON public.agendamentos 
FOR UPDATE 
USING (professional_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_agendamentos_updated_at
BEFORE UPDATE ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();