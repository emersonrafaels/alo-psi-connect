
CREATE TABLE public.praticas_grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.praticas_grupos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.praticas_grupos TO authenticated;
GRANT ALL ON public.praticas_grupos TO service_role;
ALTER TABLE public.praticas_grupos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active grupos" ON public.praticas_grupos FOR SELECT
  USING (ativo = true OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins manage grupos" ON public.praticas_grupos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE TRIGGER update_praticas_grupos_updated_at BEFORE UPDATE ON public.praticas_grupos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.praticas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  grupo_id UUID REFERENCES public.praticas_grupos(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  descricao_curta TEXT,
  corpo_ciencia TEXT,
  icone TEXT,
  duracao_min_default INTEGER NOT NULL DEFAULT 5,
  duracoes_disponiveis INTEGER[] NOT NULL DEFAULT ARRAY[3,5,10],
  ideal_para TEXT,
  categoria_badge TEXT,
  audio_url TEXT,
  tem_audio BOOLEAN NOT NULL DEFAULT false,
  padrao_respiracao JSONB NOT NULL DEFAULT '{"inspirar":4,"segurar":0,"expirar":6}'::jsonb,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  destaque BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.praticas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.praticas TO authenticated;
GRANT ALL ON public.praticas TO service_role;
ALTER TABLE public.praticas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active praticas" ON public.praticas FOR SELECT
  USING (ativo = true OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins manage praticas" ON public.praticas FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE TRIGGER update_praticas_updated_at BEFORE UPDATE ON public.praticas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.praticas_atalhos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  texto TEXT NOT NULL,
  pratica_slug TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.praticas_atalhos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.praticas_atalhos TO authenticated;
GRANT ALL ON public.praticas_atalhos TO service_role;
ALTER TABLE public.praticas_atalhos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active atalhos" ON public.praticas_atalhos FOR SELECT
  USING (ativo = true OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Admins manage atalhos" ON public.praticas_atalhos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE TRIGGER update_praticas_atalhos_updated_at BEFORE UPDATE ON public.praticas_atalhos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.praticas_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pratica_id UUID REFERENCES public.praticas(id) ON DELETE SET NULL,
  user_id UUID,
  estado TEXT NOT NULL CHECK (estado IN ('calmo','energizado','leve','reflexivo','igual')),
  nota TEXT,
  duracao_segundos INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.praticas_checkouts TO anon;
GRANT SELECT, INSERT ON public.praticas_checkouts TO authenticated;
GRANT ALL ON public.praticas_checkouts TO service_role;
ALTER TABLE public.praticas_checkouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert checkout" ON public.praticas_checkouts FOR INSERT WITH CHECK (true);
CREATE POLICY "User reads own checkouts" ON public.praticas_checkouts FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

INSERT INTO public.praticas_grupos (slug, nome, descricao, ordem) VALUES
  ('regular-agora', 'Regular agora', 'Práticas breves para momentos de alta reatividade.', 1),
  ('soltar-o-corpo', 'Soltar o corpo', 'Exercícios para liberar tensão física acumulada.', 2),
  ('acolher-desacelerar', 'Acolher e desacelerar', 'Pausas para autocompaixão e descanso profundo.', 3);

INSERT INTO public.praticas (slug, grupo_id, titulo, subtitulo, descricao_curta, corpo_ciencia, icone, duracao_min_default, duracoes_disponiveis, ideal_para, categoria_badge, padrao_respiracao, ordem) VALUES
  ('respiracao-lenta-ritmada', (SELECT id FROM public.praticas_grupos WHERE slug='regular-agora'),
   'Respiração lenta ritmada','Sintonize seu ritmo interno para acalmar o sistema nervoso através de ciclos controlados de ar.',
   'Equilibra o sistema nervoso autônomo e reduz a ansiedade aguda.',
   'A respiração lenta não é apenas um exercício de relaxamento; é uma intervenção biológica direta. Ao reduzir o ritmo respiratório para cerca de 6 ciclos por minuto, você ativa o nervo vago, o principal componente do sistema nervoso parassimpático. Isso sinaliza instantaneamente ao seu cérebro que você está seguro, reduzindo os níveis de cortisol e estabilizando a variabilidade da frequência cardíaca (VFC).',
   'Wind', 5, ARRAY[3,5,10], 'Ansiedade aguda', 'EVIDÊNCIA', '{"inspirar":4,"segurar":0,"expirar":6}'::jsonb, 1),
  ('respiracao-abdominal', (SELECT id FROM public.praticas_grupos WHERE slug='regular-agora'),
   'Respiração abdominal','Ativação direta do nervo vago para relaxamento imediato.',
   'Ativação direta do nervo vago para relaxamento imediato.',
   'A respiração diafragmática reduz a frequência cardíaca e a pressão arterial em poucos minutos, deslocando o corpo do modo de luta-ou-fuga para o de descanso e digestão.',
   'HeartPulse', 3, ARRAY[3,5,10], 'Alívio de tensão', 'CIÊNCIA', '{"inspirar":4,"segurar":2,"expirar":6}'::jsonb, 2),
  ('voltar-ao-presente', (SELECT id FROM public.praticas_grupos WHERE slug='regular-agora'),
   'Voltar ao presente pela respiração','Técnica de ancoragem sensorial para mentes dispersas.',
   'Âncora imediata para pensamentos acelerados.',
   'A atenção plena à respiração interrompe ciclos de ruminação ao redirecionar recursos cognitivos do córtex pré-frontal para o processamento sensorial presente, reduzindo a atividade da rede de modo padrão.',
   'Eye', 4, ARRAY[3,4,8], 'Ruminação mental', 'FOCO', '{"inspirar":4,"segurar":4,"expirar":4}'::jsonb, 3),
  ('quick-coherence', (SELECT id FROM public.praticas_grupos WHERE slug='regular-agora'),
   'Quick Coherence','Sincronia entre coração e mente para resiliência emocional.',
   'Harmonize coração e mente rapidamente.',
   'Desenvolvida pelo HeartMath Institute, a técnica combina respiração ritmada com foco em sentimentos de gratidão para induzir um estado de coerência cardíaca — sincronia entre sistema nervoso, ritmo cardíaco e cognição.',
   'Activity', 5, ARRAY[2,5,8], 'Estresse súbito', 'COERÊNCIA', '{"inspirar":5,"segurar":0,"expirar":5}'::jsonb, 4),
  ('soltar-tensao-corpo', (SELECT id FROM public.praticas_grupos WHERE slug='soltar-o-corpo'),
   'Soltar a tensão do corpo','Escaneamento progressivo para liberar pontos de contração física acumulada durante o dia.',
   'Um escaneamento gentil focado na liberação de pontos de estresse físico.',
   'O relaxamento muscular progressivo demonstrou reduzir significativamente sintomas físicos de ansiedade ao interromper o ciclo de feedback entre tensão muscular e percepção de estresse.',
   'Sparkles', 12, ARRAY[8,12,20], 'Tensão acumulada', 'CORPO', '{"inspirar":4,"segurar":0,"expirar":6}'::jsonb, 5),
  ('criar-espaco-interno', (SELECT id FROM public.praticas_grupos WHERE slug='soltar-o-corpo'),
   'Criar um espaço interno de calma','Visualização guiada para construir um refúgio mental de calma e segurança absoluta.',
   'Visualização criativa para construir um refúgio seguro em sua mente.',
   'Técnicas de imagery guidada ativam as mesmas regiões cerebrais envolvidas em experiências reais de segurança, criando memórias afetivas que podem ser acessadas em momentos de estresse.',
   'Mountain', 15, ARRAY[10,15,20], 'Sobrecarga emocional', 'VISUALIZAÇÃO', '{"inspirar":5,"segurar":2,"expirar":7}'::jsonb, 6),
  ('pausa-autocompaixao', (SELECT id FROM public.praticas_grupos WHERE slug='acolher-desacelerar'),
   'Pausa de autocompaixão','Um momento para reconhecer o sofrimento e oferecer amabilidade a si mesma.',
   'Um momento para acolher suas dificuldades sem julgamento e com ternura.',
   'A prática de autocompaixão de Kristin Neff reduz autocrítica e ativa o sistema de afiliação e cuidado, liberando ocitocina e diminuindo a resposta de ameaça da amígdala.',
   'Heart', 8, ARRAY[5,8,12], 'Autocrítica intensa', 'CUIDADO', '{"inspirar":4,"segurar":0,"expirar":6}'::jsonb, 7),
  ('desaceleracao-profunda', (SELECT id FROM public.praticas_grupos WHERE slug='acolher-desacelerar'),
   'Desaceleração profunda','Preparação para o repouso, desligando os estímulos mentais do cotidiano.',
   'Prepare sua mente e corpo para o repouso com uma sequência de relaxamento progressivo.',
   'Práticas guiadas de relaxamento antes de dormir reduzem o tempo de latência do sono e aumentam a qualidade da fase REM, conforme estudos em medicina do sono.',
   'Moon', 15, ARRAY[10,15,20], 'Antes de dormir', 'REPOUSO', '{"inspirar":4,"segurar":7,"expirar":8}'::jsonb, 8);

UPDATE public.praticas SET destaque = true WHERE slug = 'desaceleracao-profunda';

INSERT INTO public.praticas_atalhos (texto, pratica_slug, ordem) VALUES
  ('Quero me acalmar agora', 'respiracao-lenta-ritmada', 1),
  ('Estou muito ansioso', 'respiracao-abdominal', 2),
  ('Quero aliviar a tensão do corpo', 'soltar-tensao-corpo', 3),
  ('Estou sobrecarregado', 'criar-espaco-interno', 4),
  ('Quero desacelerar antes de dormir', 'desaceleracao-profunda', 5),
  ('Preciso me tratar com menos dureza', 'pausa-autocompaixao', 6);
