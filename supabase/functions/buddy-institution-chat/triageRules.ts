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
  const e = rows.filter((r) => r.mood_score != null);
  if (e.length < 4) return null;
  const half = Math.floor(e.length / 2);
  const a = e.slice(0, half).reduce((s, r) => s + (r.mood_score || 0), 0) / half;
  const b = e.slice(half).reduce((s, r) => s + (r.mood_score || 0), 0) / (e.length - half);
  if (a === 0) return null;
  return Math.round(((b - a) / a) * 100);
}

export function baseRisk(rows: MoodRow[]): Risk {
  const m = avg(rows, "mood_score");
  if (m === null) return "no_data";
  const a = avg(rows, "anxiety_level");
  const en = avg(rows, "energy_level");
  const sl = sleepAvg(rows);
  const t = moodTrend(rows);
  if (m <= 1.5 || (a !== null && a >= 4.5) || (t !== null && t <= -40)) return "critical";
  if (m <= 2.5 || (a !== null && a >= 3.5) || (en !== null && en <= 1.5)) return "alert";
  if (m <= 3.0 || (a !== null && a >= 3.0) || (sl !== null && sl <= 2.0)) return "attention";
  return "healthy";
}

const ORDER: Risk[] = ["healthy", "attention", "alert", "critical"];
export function escalateRisk(base: Risk, severity: Severity | null | undefined): Risk {
  if (!severity) return base;
  if (severity === "grave") return "critical";
  if (base === "no_data") return "attention";
  return ORDER[Math.min(ORDER.indexOf(base) + 1, ORDER.length - 1)];
}

/** Same eligibility as the portal's "Para Triar" queue. */
export function isAwaitingTriage(risk: Risk, lastStatus: string | null): boolean {
  return risk === "critical" && (!lastStatus || lastStatus === "pending");
}

/** Queue bucket shown in the portal: Para Triar / Em Andamento / Concluídos / sem fila. */
export function queueBucket(risk: Risk, lastStatus: string | null): "para_triar" | "em_andamento" | "concluido" | "fora_da_fila" {
  if (isAwaitingTriage(risk, lastStatus)) return "para_triar";
  if (lastStatus === "in_progress") return "em_andamento";
  if (lastStatus === "resolved") return "concluido";
  return "fora_da_fila";
}
