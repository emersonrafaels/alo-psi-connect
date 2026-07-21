// Catálogo do Radar Institucional (baseado no protótipo aprovado)

export const RADAR_STEPS = [
  { id: 'institution', label: 'Instituição' },
  { id: 'respondent', label: 'Respondente' },
  { id: 'structures', label: 'Estruturas de apoio' },
  { id: 'pains', label: 'Principais desafios' },
  { id: 'adaptive', label: 'Aprofundamento' },
  { id: 'maturity', label: 'Maturidade' },
  { id: 'priority', label: 'Priorização' },
  { id: 'contact', label: 'Contato & consentimento' },
] as const;

export const RESPONDENT_ROLES = [
  'Reitoria / Direção',
  'Pró-reitoria acadêmica',
  'Pró-reitoria de assuntos estudantis',
  'Coordenação de curso',
  'Núcleo psicossocial / psicopedagógico',
  'Assistência estudantil',
  'RH / Gestão de pessoas',
  'Comunicação institucional',
  'Outra',
] as const;

export const INSTITUTION_TYPES = [
  'Privada',
  'Pública',
  'Comunitária',
  'Confessional',
  'Outra',
] as const;

export const STUDENT_RANGES = [
  'Até 1.000',
  '1.001 a 3.000',
  '3.001 a 10.000',
  '10.001 a 30.000',
  'Mais de 30.000',
] as const;

export const SUPPORT_LEVELS = [
  'Não existe uma estrutura formal',
  'Existe apoio pontual, sem fluxo definido',
  'Existe núcleo de atendimento ao aluno',
  'Existe núcleo psicossocial ou psicopedagógico',
  'Existem diferentes núcleos, mas pouco integrados',
  'Existe estrutura ampla com dados e protocolos',
  'Não sei informar',
] as const;

export const STRUCTURE_STATUS = [
  'Existe e está estruturado',
  'Existe parcialmente',
  'Está em desenvolvimento',
  'Não existe',
  'Não sei informar',
] as const;

export const INSTITUTIONAL_STRUCTURES = [
  { id: 'welcoming', name: 'Programa de acolhimento a calouros', desc: 'Ações estruturadas de recepção nos primeiros semestres.' },
  { id: 'psychopedagogical', name: 'Núcleo psicopedagógico', desc: 'Apoio à aprendizagem, dificuldades cognitivas e emocionais.' },
  { id: 'permanence', name: 'Programa de permanência estudantil', desc: 'Ações contra evasão: bolsas, tutoria, monitoria.' },
  { id: 'faculty', name: 'Formação continuada de docentes', desc: 'Capacitação em saúde mental, escuta e mediação.' },
  { id: 'data', name: 'Governança de dados institucionais', desc: 'Indicadores estruturados sobre bem-estar e permanência.' },
  { id: 'communication', name: 'Comunicação institucional sobre bem-estar', desc: 'Campanhas, canais e mensagens sobre saúde mental.' },
  { id: 'crisis', name: 'Protocolo de crise e risco', desc: 'Fluxos claros para casos de risco emocional agudo.' },
] as const;

export const PAINS = [
  { id: 'mental_health', title: 'Saúde mental dos alunos', desc: 'Ansiedade, depressão, esgotamento, ideação.' },
  { id: 'evasion', title: 'Evasão e permanência', desc: 'Perda de alunos, especialmente nos primeiros semestres.' },
  { id: 'faculty', title: 'Formação e escuta docente', desc: 'Professores despreparados para lidar com sofrimento em sala.' },
  { id: 'data', title: 'Falta de dados sobre bem-estar', desc: 'Dificuldade de enxergar padrões e agir preventivamente.' },
  { id: 'engagement', title: 'Baixa adesão a iniciativas', desc: 'Programas existem, mas alunos não participam.' },
  { id: 'crisis', title: 'Gestão de crises e risco', desc: 'Falta de protocolos claros para situações graves.' },
  { id: 'diversity', title: 'Inclusão e diversidade', desc: 'Acolhimento de grupos historicamente excluídos.' },
  { id: 'reputation', title: 'Reputação institucional', desc: 'Percepção externa sobre cuidado com o aluno.' },
] as const;

export type PainId = typeof PAINS[number]['id'];

export const ADAPTIVE_QUESTIONS: Record<PainId, { type: 'scale' | 'segmented'; title: string; text: string }> = {
  mental_health: { type: 'scale', title: 'Percepção sobre saúde mental', text: 'O quanto sua instituição sente que a saúde mental dos alunos é um tema crítico hoje?' },
  evasion: { type: 'segmented', title: 'Capacidade de agir sobre evasão', text: 'Como você avalia a maturidade da instituição para prevenir evasão?' },
  faculty: { type: 'segmented', title: 'Preparo docente', text: 'Como avalia a preparação dos professores para lidar com sofrimento emocional em sala?' },
  data: { type: 'scale', title: 'Uso de dados', text: 'Quão dependente de dados a instituição está para decisões sobre bem-estar?' },
  engagement: { type: 'segmented', title: 'Engajamento em iniciativas', text: 'Como está a adesão dos alunos às iniciativas de cuidado atuais?' },
  crisis: { type: 'segmented', title: 'Protocolos de crise', text: 'A instituição possui protocolos claros para casos de risco emocional?' },
  diversity: { type: 'scale', title: 'Diversidade e inclusão', text: 'Quão preparada a instituição está para acolher a diversidade dos alunos?' },
  reputation: { type: 'scale', title: 'Reputação em bem-estar', text: 'O quanto o cuidado com o aluno impacta a marca da instituição hoje?' },
};

export const MATURITY_DIMENSIONS = [
  { id: 'listening', name: 'Escuta ativa', desc: 'Canais de escuta contínua dos alunos.' },
  { id: 'prevention', name: 'Prevenção', desc: 'Ações antes que o sofrimento vire crise.' },
  { id: 'care', name: 'Cuidado direto', desc: 'Atendimento clínico ou psicossocial.' },
  { id: 'faculty', name: 'Rede docente', desc: 'Professores capacitados e integrados.' },
  { id: 'data', name: 'Dados e decisão', desc: 'Indicadores que orientam a gestão.' },
  { id: 'culture', name: 'Cultura institucional', desc: 'Bem-estar como parte da identidade.' },
] as const;

export const URGENCY_LEVELS = ['Baixa', 'Média', 'Alta', 'Imediata'] as const;
export const SEGMENTED_LABELS = ['Inicial', 'Em construção', 'Intermediária', 'Consolidada'] as const;

export type MaturityId = typeof MATURITY_DIMENSIONS[number]['id'];
export type StructureId = typeof INSTITUTIONAL_STRUCTURES[number]['id'];

export interface RadarAnswers {
  institution: {
    city?: string;
    state?: string;
    students?: string;
    type?: string;
    support?: string;
  };
  respondent: {
    name?: string;
    role?: string;
    area?: string;
    email?: string;
    phone?: string;
  };
  structures: Partial<Record<StructureId, string>>;
  pains: PainId[];
  adaptive: Partial<Record<PainId, number>>;
  maturity: Record<MaturityId, number>;
  priorities: Partial<Record<PainId, string>>;
  consent: boolean;
}

export const emptyAnswers = (): RadarAnswers => ({
  institution: {},
  respondent: {},
  structures: Object.fromEntries(INSTITUTIONAL_STRUCTURES.map(s => [s.id, 'Não sei informar'])) as any,
  pains: [],
  adaptive: {},
  maturity: Object.fromEntries(MATURITY_DIMENSIONS.map(d => [d.id, 50])) as any,
  priorities: {},
  consent: false,
});

export function computeOverallScore(maturity: Record<string, number>): number {
  const vals = Object.values(maturity);
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}
