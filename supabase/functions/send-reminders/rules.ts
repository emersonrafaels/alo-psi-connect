// Pure rules for daily student reminder emails.
export type Lang = 'pt' | 'en' | 'es';
export interface ReminderInput { now: Date; lastDiary: string | null; radarSemesters: string[]; semester: string; sessionsToday: string[] }

const T = {
  pt: { diary: (d: number | null) => d === null ? 'Faça seu primeiro registro no diário emocional.' : `Seu diário está parado há ${d} dias.`, radar: (s: string) => `Responda o Radar de Permanência do semestre ${s}.`, session: (t: string) => `Hoje tem encontro: ${t}.`, subject: 'Seus lembretes da Rede Bem-Estar', cta: 'Abrir Meu espaço', off: 'Você pode desligar estes lembretes no Meu espaço.' },
  en: { diary: (d: number | null) => d === null ? 'Make your first emotional diary entry.' : `Your diary has been idle for ${d} days.`, radar: (s: string) => `Answer the Retention Radar for semester ${s}.`, session: (t: string) => `You have a session today: ${t}.`, subject: 'Your Rede Bem-Estar reminders', cta: 'Open My space', off: 'You can turn these reminders off in My space.' },
  es: { diary: (d: number | null) => d === null ? 'Haz tu primer registro en el diario emocional.' : `Tu diario lleva ${d} días sin registros.`, radar: (s: string) => `Responde el Radar de Permanencia del semestre ${s}.`, session: (t: string) => `Hoy tienes encuentro: ${t}.`, subject: 'Tus recordatorios de Rede Bem-Estar', cta: 'Abrir Mi espacio', off: 'Puedes desactivar estos recordatorios en Mi espacio.' },
};
export const texts = (l: string) => T[(l === 'en' || l === 'es') ? l : 'pt'];

export function buildReminders(i: ReminderInput, lang: string): string[] {
  const t = texts(lang);
  const out: string[] = [];
  const day = i.now.toISOString().slice(0, 10);
  const gap = i.lastDiary ? Math.floor((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${i.lastDiary.slice(0, 10)}T00:00:00Z`)) / 86_400_000) : null;
  if (gap === null || gap >= 2) out.push(t.diary(gap));
  if (!i.radarSemesters.includes(i.semester)) out.push(t.radar(i.semester));
  for (const s of i.sessionsToday) out.push(t.session(s));
  return out;
}

export const semesterOf = (d: Date) => `${d.getUTCFullYear()}.${d.getUTCMonth() < 6 ? 1 : 2}`;
