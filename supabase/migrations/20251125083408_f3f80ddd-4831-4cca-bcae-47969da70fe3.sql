-- Insert demo group sessions for /encontros page
DO $$
DECLARE
  v_tenant_id uuid;
  v_prof_bianca bigint;
  v_prof_erika bigint;
  v_prof_anne bigint;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'alopsi' LIMIT 1;
  
  SELECT id INTO v_prof_bianca FROM profissionais WHERE crp_crm = '06/185131' LIMIT 1;
  SELECT id INTO v_prof_erika FROM profissionais WHERE crp_crm = '06/66795' LIMIT 1;
  SELECT id INTO v_prof_anne FROM profissionais WHERE display_name ILIKE '%Anne%' AND display_name ILIKE '%Kaufmann%' LIMIT 1;
  
  INSERT INTO group_sessions (
    tenant_id, title, description, session_type, session_date, start_time, duration_minutes,
    organizer_type, professional_id, max_participants, current_registrations, is_free, has_libras, audience_type, status
  ) VALUES
  (v_tenant_id, 'Como encarar os dias difíceis',
   'Aprenda estratégias práticas para lidar com momentos desafiadores e fortalecer sua resiliência emocional. Um encontro acolhedor para compartilhar experiências e descobrir ferramentas de autocuidado.',
   'workshop', '2025-11-25', '17:00', 90, 'professional', v_prof_bianca, 30, 12, true, false, 'all', 'scheduled'),
  (v_tenant_id, 'Desapegue da necessidade de controle',
   'Explore técnicas para reduzir a ansiedade causada pela necessidade de controlar tudo. Descubra como aceitar a incerteza e viver com mais leveza e flexibilidade no dia a dia.',
   'workshop', '2025-11-26', '12:00', 90, 'professional', v_prof_erika, 25, 8, true, false, 'all', 'scheduled'),
  (v_tenant_id, 'Descobrindo seus valores e propósito',
   'Uma jornada reflexiva para identificar o que realmente importa para você. Exercícios práticos para alinhar suas ações com seus valores mais profundos e criar uma vida com mais significado.',
   'workshop', '2025-11-27', '17:00', 120, 'professional', v_prof_anne, 20, 5, true, false, 'all', 'scheduled'),
  (v_tenant_id, 'Lidando com a ansiedade no trabalho',
   'Identifique gatilhos de ansiedade no ambiente profissional e aprenda técnicas de regulação emocional. Estratégias para manter o equilíbrio entre produtividade e bem-estar mental.',
   'palestra', '2025-12-02', '19:00', 60, 'professional', v_prof_bianca, 40, 0, true, false, 'all', 'scheduled'),
  (v_tenant_id, 'Autocuidado: por onde começar?',
   'Um bate-papo acolhedor sobre a importância do autocuidado e como criar hábitos sustentáveis. Compartilhe suas dificuldades e descubra pequenas práticas que fazem grande diferença no seu bem-estar.',
   'roda_conversa', '2025-12-04', '18:00', 90, 'professional', v_prof_erika, 15, 0, true, false, 'all', 'scheduled'),
  (v_tenant_id, 'Inteligência emocional na prática',
   'Desenvolva suas habilidades emocionais através de exercícios práticos e dinâmicas de grupo. Aprenda a reconhecer, compreender e gerenciar suas emoções de forma saudável e construtiva.',
   'workshop', '2025-12-10', '17:00', 120, 'professional', v_prof_anne, 25, 0, true, true, 'all', 'scheduled');
END $$;