export type TriageRiskLevel = 'baixo' | 'moderado' | 'alto' | 'critico' | 'sem_dados' | string;

export interface TriageNoteTemplate {
  id: string;
  label: string;
  /** One line shown in the picker so the team can choose without reading the whole text. */
  summary: string;
  content: string;
}

type Bucket = 'baixo' | 'moderado' | 'alto' | 'critico' | 'sem_dados';

/** Structured notes: one line per field, so the next person can scan what was done and what comes next. */
export const TRIAGE_NOTE_TEMPLATES: Record<Bucket, TriageNoteTemplate[]> = {
  critico: [
    {
      id: 'crit-emergencia',
      label: 'Protocolo de emergência',
      summary: 'Contato imediato, encaminhamento e reavaliação em 24h',
      content: [
        'Ação: protocolo de emergência da instituição acionado; contato imediato com o aluno.',
        'Encaminhamento: avaliação com profissional de saúde mental; serviço de urgência se houver risco iminente (SAMU 192).',
        'Rede de apoio: contato de emergência do aluno acionado? ',
        'Próxima reavaliação: em até 24h.',
      ].join('\n'),
    },
    {
      id: 'crit-plano',
      label: 'Plano de segurança',
      summary: 'Sinais de alerta, contatos de apoio e meios de proteção',
      content: [
        'Ação: plano de segurança construído com o aluno.',
        'Sinais de alerta identificados: ',
        'Contatos de apoio: CVV 188 (24h), SAMU 192 e ',
        'Proteção: orientado a reduzir acesso a meios de autolesão.',
        'Próxima reavaliação: em 24–48h.',
      ].join('\n'),
    },
    {
      id: 'crit-sem-retorno',
      label: 'Tentativa de contato sem retorno',
      summary: 'Registrar a tentativa e o próximo passo',
      content: [
        'Tentativa de contato: (canal e horário) sem retorno.',
        'Próximo passo: nova tentativa em até 24h por outro canal; acionar coordenação se não houver retorno.',
      ].join('\n'),
    },
  ],
  alto: [
    {
      id: 'alto-contato',
      label: 'Contato em até 48h',
      summary: 'Conversa de acolhimento e plano de cuidado',
      content: [
        'Ação: contato direto com o aluno para conversa de acolhimento em até 48h.',
        'Combinado com o aluno: ',
        'Próximo acompanhamento: em 7 dias.',
      ].join('\n'),
    },
    {
      id: 'alto-profissional',
      label: 'Encaminhar para profissional',
      summary: 'Encaminhamento para atendimento psicológico',
      content: [
        'Ação: encaminhado para atendimento com profissional de saúde mental.',
        'Profissional / serviço: ',
        'Próximo acompanhamento: confirmar o primeiro atendimento em até 7 dias.',
      ].join('\n'),
    },
    {
      id: 'alto-sem-retorno',
      label: 'Tentativa de contato sem retorno',
      summary: 'Registrar a tentativa e o próximo passo',
      content: [
        'Tentativa de contato: (canal e horário) sem retorno.',
        'Próximo passo: nova tentativa em até 48h.',
      ].join('\n'),
    },
  ],
  moderado: [
    {
      id: 'mod-escuta',
      label: 'Conversa de escuta',
      summary: 'Agendar conversa individual nos próximos 7 dias',
      content: [
        'Ação: conversa individual de escuta agendada para os próximos 7 dias.',
        'Recursos compartilhados: práticas guiadas e canais de acolhimento da instituição.',
        'Próximo acompanhamento: reavaliar em 14 dias.',
      ].join('\n'),
    },
    {
      id: 'mod-monitorar',
      label: 'Monitorar próximo check-in',
      summary: 'Acompanhar os próximos registros do diário',
      content: [
        'Ação: monitorar os próximos registros do diário emocional.',
        'Critério para escalar: piora do humor ou ansiedade nos próximos check-ins.',
        'Próximo acompanhamento: em 7 dias.',
      ].join('\n'),
    },
    {
      id: 'mod-grupo',
      label: 'Convidar para grupo temático',
      summary: 'Encontro coletivo alinhado aos temas identificados',
      content: [
        'Ação: convite para encontro coletivo sobre ',
        'Próximo acompanhamento: reavaliar em 14 dias.',
      ].join('\n'),
    },
  ],
  baixo: [
    {
      id: 'baixo-monitorar',
      label: 'Monitoramento leve',
      summary: 'Observação semanal pelo diário emocional',
      content: [
        'Situação: sinais leves, sem necessidade de intervenção agora.',
        'Ação: manter observação semanal pelo diário emocional e reforçar os canais de acolhimento.',
      ].join('\n'),
    },
    {
      id: 'baixo-reforcar',
      label: 'Reforçar bons hábitos',
      summary: 'Indicadores estáveis; check-in mensal',
      content: [
        'Situação: indicadores estáveis.',
        'Ação: reforçar hábitos positivos e incentivar participação em grupos de bem-estar.',
        'Próximo acompanhamento: check-in mensal.',
      ].join('\n'),
    },
  ],
  sem_dados: [
    {
      id: 'sd-diario',
      label: 'Incentivar o diário',
      summary: 'Aluno sem registros no período',
      content: [
        'Situação: sem registros no diário emocional no período.',
        'Ação: convite para retomar o diário e lembrete dos canais de acolhimento.',
        'Próximo acompanhamento: verificar novos registros em 7 dias.',
      ].join('\n'),
    },
  ],
};

const BUCKET_OF: Record<string, Bucket> = {
  critical: 'critico', critico: 'critico', crítico: 'critico',
  alert: 'alto', high: 'alto', alto: 'alto',
  attention: 'moderado', medium: 'moderado', moderate: 'moderado', moderado: 'moderado',
  healthy: 'baixo', low: 'baixo', baixo: 'baixo',
  no_data: 'sem_dados', sem_dados: 'sem_dados',
};

/** Same wording as the triage risk badges. */
const BUCKET_LABEL: Record<Bucket, string> = {
  critico: 'Sinal elevado', alto: 'Alerta', moderado: 'Atenção', baixo: 'Sem sinais prioritários', sem_dados: 'Dados insuficientes',
};

const bucketOf = (risk?: string | null): Bucket => BUCKET_OF[String(risk ?? '').toLowerCase()] ?? 'moderado';

export function getTemplatesForRisk(risk?: string | null): TriageNoteTemplate[] {
  return [...TRIAGE_NOTE_TEMPLATES[bucketOf(risk)]];
}

export function riskLevelLabel(risk?: string | null): string {
  return BUCKET_LABEL[bucketOf(risk)];
}

/**
 * Adds a template to the note being written. An empty note starts with the reasons the student is
 * in the queue; an existing note keeps its text and gets the template appended, never replaced.
 */
export function applyTemplate(current: string, template: TriageNoteTemplate, reasons: string[] = []): string {
  const text = current.trimEnd();
  if (text.includes(template.content)) return current;
  if (!text) return reasons.length > 0 ? `Motivo: ${reasons.join(' · ')}\n${template.content}` : template.content;
  return `${text}\n\n${template.content}`;
}
