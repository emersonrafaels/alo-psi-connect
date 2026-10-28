export type NedRaw = {
  key: string; nome: string; uf: string; reg: string; tipo: string; est: number; atend: number; horas: number; esp: number; com: number;
  col: number; pei: number; peis: number; niv: number; sat: number; eq: number[]; ate: string; grupo: number; canais: string;
  rel: number[]; plano: number; cia: number; dem: number[];
};
export type MetricKey = 'alc' | 'hor' | 'esp' | 'com' | 'col' | 'pei' | 'niv' | 'sat' | 'ges';
export type Ned = NedRaw & Record<MetricKey, number> & { full: boolean; need: number[]; g: Record<MetricKey, -1 | 0 | 1>; good: number; bad: number };

const br = (v: number, d = 1) => v.toFixed(d).replace('.', ',');
const pf = (v: number) => `${v % 1 ? br(v, 1) : v}%`;
export const METRICS: { k: MetricKey; label: string; pillar: string; up: boolean; tol: number; f: (v: number) => string; tip: string }[] = [
  { k: 'alc', label: 'Atendidos por 100', pillar: 'Acesso', up: true, tol: 1, f: (v) => br(v), tip: 'Estudantes atendidos pelo NED no semestre, por 100 matriculados' },
  { k: 'hor', label: 'Horas de equipe por 100', pillar: 'Acesso', up: true, tol: 0.6, f: (v) => br(v), tip: 'Horas semanais da equipe do NED por 100 matriculados' },
  { k: 'esp', label: 'Espera (dias)', pillar: 'Resposta', up: false, tol: 1, f: (v) => String(v), tip: 'Mediana de dias entre o pedido e o 1º acolhimento' },
  { k: 'com', label: 'Comparecimento', pillar: 'Resposta', up: true, tol: 3, f: pf, tip: 'Atendimentos realizados sobre atendimentos marcados' },
  { k: 'col', label: 'Ações coletivas', pillar: 'Prevenção', up: true, tol: 1, f: (v) => String(v), tip: 'Oficinas, rodas e palestras no semestre' },
  { k: 'pei', label: 'Adaptações no prazo', pillar: 'Inclusão', up: true, tol: 4, f: pf, tip: 'Adaptações de acessibilidade e PEI entregues no prazo' },
  { k: 'niv', label: 'Nivelamento', pillar: 'Acadêmico', up: true, tol: 6, f: pf, tip: 'Participação dos convocados no nivelamento' },
  { k: 'sat', label: 'Satisfação', pillar: 'Experiência', up: true, tol: 0.15, f: (v) => br(v), tip: 'Nota média de 1 a 5 dada após o atendimento' },
  { k: 'ges', label: 'Gestão em dia', pillar: 'Gestão', up: true, tol: 10, f: pf, tip: 'Relatórios mensais, plano semestral e CIA em dia' },
];
export const ROLES = ['Coordenação', 'Psicopedagogia', 'Psicologia', 'Apoio administrativo'];
export const DEM = ['Ansiedade e questões emocionais', 'Aprendizagem e estudo', 'Organização do tempo', 'Inclusão e acessibilidade', 'Conflitos e luto', 'Carreira e vocação'];

export function median(a: number[]) {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** 1 = better than median beyond tolerance, -1 = worse, 0 = close. Respects metric direction. */
export function vsMedian(v: number, med: number, up: boolean, tol: number): -1 | 0 | 1 {
  const d = up ? v - med : med - v;
  return d > tol ? 1 : d < -tol ? -1 : 0;
}

/** Required staff by role (regulation): coord 1, psicopedagogia 2, psicologia 1, apoio 1 only for centros universitários. */
export const requiredTeam = (tipo: string) => [1, 2, 1, tipo === 'Centro universitário' ? 1 : 0];

export function enrich(raw: NedRaw[]): { neds: Ned[]; med: Record<MetricKey, number> } {
  const base = raw.map((n) => {
    const items = [...n.rel, n.plano, n.cia];
    const need = requiredTeam(n.tipo);
    return { ...n, alc: (n.atend / n.est) * 100, hor: (n.horas / n.est) * 100, ges: Math.round((items.filter((x) => x === 1).length / items.length) * 100), need, full: n.eq.every((v, i) => v >= need[i]) };
  });
  const med = Object.fromEntries(METRICS.map((m) => [m.k, median(base.map((n) => (n as any)[m.k]))])) as Record<MetricKey, number>;
  const neds = base.map((n) => {
    const g = Object.fromEntries(METRICS.map((m) => [m.k, vsMedian((n as any)[m.k], med[m.k], m.up, m.tol)])) as Record<MetricKey, -1 | 0 | 1>;
    const vals = Object.values(g);
    return { ...(n as any), g, good: vals.filter((x) => x === 1).length, bad: vals.filter((x) => x === -1).length } as Ned;
  });
  return { neds, med };
}

/** Attention-first ordering: most points of attention, then fewest strengths. */
export const byAttention = (a: Ned, b: Ned) => b.bad - a.bad || a.good - b.good;

/** Quadrant in the demand x staff chart, relative to national medians. */
export function quadrant(alc: number, hor: number, medAlc: number, medHor: number) {
  const hiD = alc >= medAlc, hiS = hor >= medHor;
  return hiD && !hiS ? 'Muita procura, pouca equipe' : hiD && hiS ? 'Muita procura, equipe forte' : !hiD && !hiS ? 'Pouca procura, pouca equipe' : 'Equipe com folga';
}

export function alertText(n: Ned, med: Record<MetricKey, number>): string {
  const p: string[] = [];
  if (n.g.esp < 0) p.push(`espera de ${n.esp} dias`);
  const missing = ROLES.filter((_, i) => n.eq[i] < n.need[i]).map((r) => r.toLowerCase());
  if (missing.length) p.push(`falta ${missing.join(' e ')} na equipe`);
  const late = n.rel.filter((x) => x !== 1).length;
  if (late) p.push(`${late} ${late === 1 ? 'relatório pendente' : 'relatórios pendentes'}`);
  if (n.col === 0) p.push('nenhuma ação coletiva no semestre');
  if (n.g.com < 0) p.push(`comparecimento de ${n.com}% (mediana ${Math.round(med.com)}%)`);
  if (!p.length) return '';
  const s = p.join(', ');
  return s[0].toUpperCase() + s.slice(1) + '.';
}

export type BestPractice = { key: string; origem: string; titulo: string; texto: string; k: MetricKey; antes: number; unit: string; max: number; steps: string[]; cand: (n: Ned, med: Record<MetricKey, number>) => boolean };
export const BEST_PRACTICES: BestPractice[] = [
  { key: 'noite', origem: 'mc', titulo: 'Atendimento até as 21h', texto: 'Horários noturnos abertos em 2026.2 para quem trabalha e estuda. A agenda da noite aparece na Rede Bem-Estar como qualquer outro horário.', k: 'esp', antes: 9, unit: 'dias de espera até o acolhimento', max: 14,
    steps: ['Um profissional em horário estendido duas vezes por semana', 'Agenda noturna aberta na plataforma', 'Divulgação nas turmas do período noturno'], cand: (n, m) => n.esp > m.esp && n.ate === '17h' },
  { key: 'grupo', origem: 'te', titulo: 'Acolhimento coletivo como primeira porta', texto: 'Encontros temáticos semanais em grupo antes do atendimento individual. Quem precisa de mais cuidado segue para o atendimento individual.', k: 'alc', antes: 11.2, unit: 'estudantes atendidos por 100', max: 20,
    steps: ['Encontros semanais com tema fixo', 'Psicopedagoga e psicóloga conduzindo em dupla', 'Atendimento individual para quem precisa depois'], cand: (n, m) => n.grupo < 10 && n.alc < m.alc + 1 },
  { key: 'pei', origem: 'ga', titulo: 'PEI revisado a cada bimestre', texto: 'O plano educacional individualizado é revisado com a coordenação de curso a cada bimestre, com uma lista de adaptações por disciplina.', k: 'pei', antes: 74, unit: 'das adaptações entregues no prazo', max: 100,
    steps: ['Reunião bimestral com a coordenação de curso', 'Lista de adaptações por disciplina', 'Retorno ao estudante depois de cada revisão'], cand: (n) => n.g.pei < 0 },
  { key: 'rel', origem: 'it', titulo: 'Relatório mensal pela plataforma', texto: 'Os números do mês chegam preenchidos pela plataforma e o NED completa só a parte qualitativa antes de enviar ao NED Nacional.', k: 'ges', antes: 60, unit: 'da rotina de gestão em dia', max: 100,
    steps: ['Números do mês calculados automaticamente', 'NED completa só o que é qualitativo', 'Envio com um clique ao NED Nacional'], cand: (n) => n.ges < 60 },
];

export const INDICATORS: [string, string, 'rbe' | 'ned' | 'aca', string][] = [
  ['Atendidos por 100 estudantes', 'Alcance do NED na unidade', 'ned', 'Mensal'],
  ['Horas de equipe por 100', 'Capacidade frente ao número de estudantes', 'ned', 'Semestral'],
  ['Espera até o acolhimento', 'Tempo entre o pedido e o primeiro atendimento', 'rbe', 'Contínua'],
  ['Comparecimento', 'Atendimentos realizados sobre marcados', 'rbe', 'Contínua'],
  ['Ações coletivas', 'Oficinas, rodas e palestras realizadas', 'ned', 'Mensal'],
  ['Adaptações no prazo', 'PEI e adaptações de acessibilidade entregues a tempo', 'ned', 'Mensal'],
  ['Participação no nivelamento', 'Convocados que participaram', 'aca', 'Semestral'],
  ['Satisfação', 'Nota dada pelo estudante após o atendimento', 'rbe', 'Contínua'],
  ['Gestão em dia', 'Relatórios mensais, plano semestral e CIA ativa', 'rbe', 'Mensal'],
];
