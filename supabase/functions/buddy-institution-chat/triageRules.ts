// Pure copy of the portal triage rules (src/hooks/useStudentTriage.tsx,
// src/features/triage/criticalTerms.ts, src/features/triage/priorities.ts).
// Kept dependency-free so the frontend test suite can verify parity.

export type Risk = "critical" | "alert" | "attention" | "healthy" | "no_data";
export type Severity = "grave" | "moderate";

export interface MoodRow {
  mood_score: number | null;
  anxiety_level: number | null;
  energy_level: number | null;
  sleep_quality: number | null;
  sleep_hours: number | null;
  date: string;
}

const avg = (rows: MoodRow[], f: keyof MoodRow): number | null => {
  const v = rows.filter((r) => r[f] != null);
  return v.length ? v.reduce((s, r) => s + (r[f] as number), 0) / v.length : null;
};

const sleepAvg = (rows: MoodRow[]): number | null => {
  const v = rows.filter((r) => r.sleep_quality != null || r.sleep_hours != null);
  if (!v.length) return null;
  return v.reduce((s, r) => s + (r.sleep_quality ?? Math.min(5, Math.max(1, Math.round(((r.sleep_hours as number) - 3) / 1.5 + 1)))), 0) / v.length;
};

export function moodTrend(rows: MoodRow[]): number | null {
  const v = rows.map((r) => r.mood_score).filter((x): x is number => typeof x === "number");
  if (v.length < 4) return null;
  const half = Math.floor(v.length / 2);
  const a = v.slice(0, half).reduce((s, x) => s + x, 0) / half;
  const b = v.slice(half).reduce((s, x) => s + x, 0) / (v.length - half);
  if (!(a > 0)) return null;
  return Math.round(((b - a) / a) * 100);
}

/** Phase 1: highest numeric level met; mood drop never raises the level. */
export function baseRisk(rows: MoodRow[]): Risk {
  const m = avg(rows, "mood_score");
  const a = avg(rows, "anxiety_level");
  const en = avg(rows, "energy_level");
  const sl = sleepAvg(rows);
  if (m === null && a === null && en === null && sl === null) return "no_data";
  if ((m !== null && m <= 1.5) || (a !== null && a >= 4.5)) return "critical";
  if ((m !== null && m <= 2.5) || (a !== null && a >= 3.5) || (en !== null && en <= 1.5)) return "alert";
  if ((m !== null && m <= 3.0) || (a !== null && a >= 3.0) || (sl !== null && sl <= 2.0)) return "attention";
  return "healthy";
}

/** Diary keywords are a separate text signal and never change the level. */
export function escalateRisk(base: Risk, _severity: Severity | null | undefined): Risk {
  return base;
}

/** Same eligibility as the portal's "Para Triar" queue. */
export function isAwaitingTriage(risk: Risk, lastStatus: string | null): boolean {
  return lastStatus === "pending" || (risk === "critical" && !lastStatus);
}

/** Queue bucket shown in the portal: Para Triar / Em Andamento / Concluídos / sem fila. */
export function queueBucket(risk: Risk, lastStatus: string | null): "para_triar" | "em_andamento" | "concluido" | "fora_da_fila" {
  if (isAwaitingTriage(risk, lastStatus)) return "para_triar";
  if (lastStatus === "in_progress" || lastStatus === "triaged") return "em_andamento";
  if (lastStatus === "resolved") return "concluido";
  return "fora_da_fila";
}
