-- Create AI data sources configuration table
CREATE TABLE public.ai_data_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  privacy_level TEXT NOT NULL DEFAULT 'basic' CHECK (privacy_level IN ('public', 'basic', 'moderate', 'complete')),
  data_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.ai_data_sources ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Super admins can manage AI data sources" 
ON public.ai_data_sources 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can view AI data sources" 
ON public.ai_data_sources 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_ai_data_sources_updated_at
BEFORE UPDATE ON public.ai_data_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default data sources
INSERT INTO public.ai_data_sources (source_name, display_name, description, enabled, privacy_level, data_fields) VALUES
('professionals', 'Dados dos Profissionais', 'Informações sobre profissionais disponíveis (nome, especialidades, horários)', true, 'public', '{"fields": ["display_name", "profissao", "servicos_normalizados", "resumo_profissional"]}'),
('mood_entries', 'Entradas do Diário Emocional', 'Dados do humor, energia, ansiedade e sono dos usuários', false, 'moderate', '{"fields": ["mood_score", "energy_level", "anxiety_level", "sleep_quality", "sleep_hours", "tags"]}'),
('mood_entries_journal', 'Textos do Diário Emocional', 'Textos pessoais e áudios do diário emocional', false, 'complete', '{"fields": ["journal_text", "audio_url"]}'),
('appointments', 'Histórico de Agendamentos', 'Informações sobre consultas agendadas dos usuários', false, 'basic', '{"fields": ["data_consulta", "horario", "status", "professional_id"]}'),
('user_profile', 'Perfil do Usuário', 'Informações básicas do perfil (nome, idade, gênero)', false, 'basic', '{"fields": ["nome", "data_nascimento", "genero", "como_conheceu"]}'),
('ai_insights', 'Histórico de Insights IA', 'Insights anteriores gerados pela IA para o usuário', false, 'moderate', '{"fields": ["insight_content", "mood_data", "feedback_rating"]}');