export type TriageRiskLevel = 'baixo' | 'moderado' | 'alto' | 'critico' | string;

export interface TriageNoteTemplate {
  id: string;
  label: string;
  content: string;
}

export const TRIAGE_NOTE_TEMPLATES: Record<string, TriageNoteTemplate[]> = {
  baixo: [
    {
      id: 'baixo-monitorar',
      label: 'Monitoramento leve',
      content:
        'Aluno com sinais leves. Manter observação semanal via diário emocional. Sugerir prática de respiração e reforçar canais de acolhimento.',
    },
    {
      id: 'baixo-reforcar',
      label: 'Reforçar bons hábitos',
      content:
        'Indicadores estáveis. Reforçar hábitos positivos, incentivar participação em grupos de bem-estar e manter check-in mensal.',
    },
  ],
  moderado: [
    {
      id: 'mod-agendar',
      label: 'Agendar conversa de escuta',
      content:
        'Sinais moderados de sofrimento. Agendar conversa individual de escuta com equipe de acolhimento nos próximos 7 dias. Compartilhar recursos de prática guiada.',
    },
    {
      id: 'mod-grupo',
      label: 'Convidar para grupo temático',
      content:
        'Sugerir participação em encontro coletivo alinhado aos temas identificados. Reavaliar em 14 dias.',
    },
  ],
  alto: [
    {
      id: 'alto-contato',
      label: 'Contato imediato + profissional',
      content:
        'Risco alto. Realizar contato direto em até 48h, oferecer acolhimento presencial e encaminhar para atendimento com profissional. Registrar plano de cuidado.',
    },
    {
      id: 'alto-familia',
      label: 'Rede de apoio familiar',
      content:
        'Ativar rede de apoio familiar quando autorizado. Acompanhamento semanal por 4 semanas com registro de evolução.',
    },
  ],
  critico: [
    {
      id: 'crit-emergencia',
      label: 'Protocolo de emergência',
      content:
        'Risco crítico. Acionar protocolo de emergência da instituição, contato imediato com aluno e responsáveis. Encaminhar para avaliação psiquiátrica e serviço de urgência quando necessário.',
    },
    {
      id: 'crit-plano',
      label: 'Plano de segurança',
      content:
        'Construir plano de segurança com o aluno, listar contatos de emergência (CVV 188, SAMU 192), reduzir acesso a meios letais e agendar reavaliação em 24-48h.',
    },
  ],
};

export function getTemplatesForRisk(risk?: string | null): TriageNoteTemplate[] {
  if (!risk) return [...(TRIAGE_NOTE_TEMPLATES.moderado || [])];
  const key = String(risk).toLowerCase();
  const map: Record<string, string> = {
    low: 'baixo', baixo: 'baixo',
    medium: 'moderado', moderate: 'moderado', moderado: 'moderado',
    high: 'alto', alto: 'alto',
    critical: 'critico', critico: 'critico', crítico: 'critico',
  };
  const bucket = map[key] || 'moderado';
  return TRIAGE_NOTE_TEMPLATES[bucket] || [];
}
