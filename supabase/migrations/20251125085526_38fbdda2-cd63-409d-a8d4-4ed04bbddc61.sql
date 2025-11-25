-- Inserir encontros de demonstração para o tenant Medcos (Dezembro 2025)
-- Tenant Medcos ID: 3a9ae5ec-50a9-4674-b808-7735e5f0afb5

INSERT INTO group_sessions (
  tenant_id,
  title,
  description,
  session_type,
  session_date,
  start_time,
  duration_minutes,
  organizer_type,
  status,
  max_participants,
  current_registrations,
  audience_type,
  is_free,
  has_libras
) VALUES
  -- Palestra: Ansiedade no Trabalho
  (
    '3a9ae5ec-50a9-4674-b808-7735e5f0afb5',
    'Ansiedade no Trabalho: Como Gerenciar',
    'Descubra técnicas práticas para controlar a ansiedade no ambiente profissional e melhorar sua produtividade sem comprometer sua saúde mental.',
    'palestra',
    '2025-12-05',
    '19:00:00',
    90,
    'tenant',
    'scheduled',
    80,
    12,
    'all',
    true,
    false
  ),
  -- Workshop: Inteligência Emocional
  (
    '3a9ae5ec-50a9-4674-b808-7735e5f0afb5',
    'Workshop: Desenvolvendo Inteligência Emocional',
    'Participe de exercícios práticos para identificar, compreender e gerenciar suas emoções de forma mais saudável e produtiva.',
    'workshop',
    '2025-12-10',
    '18:30:00',
    120,
    'tenant',
    'scheduled',
    40,
    8,
    'all',
    true,
    true
  ),
  -- Roda de Conversa: Autocuidado
  (
    '3a9ae5ec-50a9-4674-b808-7735e5f0afb5',
    'Roda de Conversa: Autocuidado na Rotina',
    'Um espaço acolhedor para compartilhar experiências e aprender estratégias simples de autocuidado que podem ser incorporadas no dia a dia.',
    'roda_conversa',
    '2025-12-12',
    '17:00:00',
    60,
    'tenant',
    'scheduled',
    25,
    15,
    'all',
    true,
    false
  ),
  -- Palestra: Sono e Saúde Mental
  (
    '3a9ae5ec-50a9-4674-b808-7735e5f0afb5',
    'Sono e Saúde Mental: A Importância do Descanso',
    'Entenda a relação profunda entre qualidade do sono e bem-estar emocional, e aprenda técnicas para melhorar seus hábitos noturnos.',
    'palestra',
    '2025-12-17',
    '20:00:00',
    75,
    'tenant',
    'scheduled',
    100,
    5,
    'all',
    true,
    false
  ),
  -- Workshop: Relacionamentos Saudáveis
  (
    '3a9ae5ec-50a9-4674-b808-7735e5f0afb5',
    'Workshop: Construindo Relacionamentos Saudáveis',
    'Explore os pilares de relacionamentos equilibrados e aprenda a estabelecer limites saudáveis em suas relações pessoais e profissionais.',
    'workshop',
    '2025-12-20',
    '19:30:00',
    90,
    'tenant',
    'scheduled',
    35,
    18,
    'all',
    true,
    true
  ),
  -- Roda de Conversa: Fim de Ano
  (
    '3a9ae5ec-50a9-4674-b808-7735e5f0afb5',
    'Roda de Conversa: Reflexões de Fim de Ano',
    'Um momento para olhar para trás com compaixão, celebrar conquistas e planejar o próximo ano com intenção e cuidado com a saúde mental.',
    'roda_conversa',
    '2025-12-28',
    '16:00:00',
    90,
    'tenant',
    'scheduled',
    30,
    7,
    'all',
    true,
    false
  );