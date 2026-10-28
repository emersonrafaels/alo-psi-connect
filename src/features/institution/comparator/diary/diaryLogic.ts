export type Week = { sem: string; unit: string; wk: string; mood: number; sleep: number; provas: number; people: number };
export type DiaryPayload = {
  elig: Record<string, number>;
  kpi: { sem: string; unit: string; people: number; entries: number; median: number; active14: number }[];
  weekly: Week[];
  dist: { sem: string; unit: string; score: number; n: number }[];
  ctx: { sem: string; unit: string; tag: string; n: number; n_exam: number }[];
  totals: { sem: string; unit: string; n: number; n_exam: number }[];
  dow: { sem: string; unit: string; dow: number; mood: number }[];
  emo: { sem: string; unit: string; emotion_id: string; family_id: string; n: number; people: number }[];
};

export const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);

/** Exam weeks: "Provas" tag share at least 1.5× the semester median and ≥ 20%. */
export function examWeeks(provas: number[]): boolean[] {
  const s = [...provas].sort((a, b) => a - b);
  const med = s.length ? s[Math.floor(s.length / 2)] : 0;
  return provas.map((p) => p >= 20 && p >= med * 1.5);
}

export const dev = (v: number, m: number) => Math.round((v - m) * 100) / 100;

/** Average mood in exam vs. other weeks, and whether sleep drops a week before mood. */
export function examInsight(mood: number[], sleep: number[], exam: boolean[]) {
  const inE = mood.filter((_, i) => exam[i]), out = mood.filter((_, i) => !exam[i]);
  if (!inE.length || !out.length) return null;
  const firsts = exam.map((e, i) => e && !exam[i - 1] ? i : -1).filter((i) => i > 0);
  const sleepLeads = firsts.length > 0 && firsts.every((i) => sleep[i - 1] < mean(sleep) && mood[i - 1] >= mean(mood) - 0.05);
  return { outside: mean(out), during: mean(inE), sleepLeads };
}

export function hardestLightest(d: { dow: number; mood: number }[]) {
  if (d.length < 2) return null;
  const s = [...d].sort((a, b) => a.mood - b.mood);
  return { hardest: s[0].dow, lightest: s[s.length - 1].dow };
}

/** Percentage-point change; null when the previous base is missing. */
export const ppChange = (now: number, prev: number | null | undefined) => (prev == null ? null : Math.round(now - prev));
