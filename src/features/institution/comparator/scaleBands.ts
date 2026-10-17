/** Reference bands for population screening (not individual diagnosis). Ranges in the displayed scale units. */
export type Band = { label: string; from: number; to: number; tone: 'bad' | 'mid' | 'ok' | 'good' };

export const SCALE_BANDS: Record<string, { description: string; bands: Band[] }> = {
  WHO5: { description: 'Bem-estar mental nas últimas duas semanas. Pontuação transformada de 0 a 100.', bands: [
    { label: 'Muito baixo', from: 0, to: 28, tone: 'bad' }, { label: 'Baixo', from: 29, to: 50, tone: 'mid' },
    { label: 'Adequado', from: 51, to: 75, tone: 'ok' }, { label: 'Alto', from: 76, to: 100, tone: 'good' }] },
  PSS10: { description: 'Percepção de estresse no último mês.', bands: [
    { label: 'Baixo', from: 0, to: 13, tone: 'good' }, { label: 'Moderado', from: 14, to: 26, tone: 'mid' }, { label: 'Alto', from: 27, to: 40, tone: 'bad' }] },
  GAD7: { description: 'Sintomas de ansiedade nas últimas duas semanas.', bands: [
    { label: 'Mínimo', from: 0, to: 4, tone: 'good' }, { label: 'Leve', from: 5, to: 9, tone: 'ok' },
    { label: 'Moderado', from: 10, to: 14, tone: 'mid' }, { label: 'Grave', from: 15, to: 21, tone: 'bad' }] },
  PHQ9: { description: 'Sintomas depressivos nas últimas duas semanas.', bands: [
    { label: 'Mínimo', from: 0, to: 4, tone: 'good' }, { label: 'Leve', from: 5, to: 9, tone: 'ok' },
    { label: 'Moderado', from: 10, to: 14, tone: 'mid' }, { label: 'Mod. grave', from: 15, to: 19, tone: 'bad' }, { label: 'Grave', from: 20, to: 27, tone: 'bad' }] },
  ISI: { description: 'Gravidade de sintomas de insônia.', bands: [
    { label: 'Sem insônia', from: 0, to: 7, tone: 'good' }, { label: 'Subliminar', from: 8, to: 14, tone: 'ok' },
    { label: 'Moderada', from: 15, to: 21, tone: 'mid' }, { label: 'Grave', from: 22, to: 28, tone: 'bad' }] },
  MHCSF: { description: 'Saúde mental positiva (emocional, social e psicológica).', bands: [
    { label: 'Baixa', from: 0, to: 27, tone: 'bad' }, { label: 'Moderada', from: 28, to: 48, tone: 'mid' }, { label: 'Alta', from: 49, to: 70, tone: 'good' }] },
  IQOL: { description: 'Qualidade de vida universitária (instrumento ainda não disponível).', bands: [
    { label: 'Baixa', from: 0, to: 40, tone: 'bad' }, { label: 'Intermediária', from: 41, to: 70, tone: 'mid' }, { label: 'Alta', from: 71, to: 100, tone: 'good' }] },
};

export const bandOf = (code: string, v: number | null) => {
  if (v == null) return null;
  const b = SCALE_BANDS[code]?.bands ?? [];
  return b.find((x) => v <= x.to + 0.5) ?? b[b.length - 1] ?? null;
};

export const TONE_CLASS: Record<Band['tone'], string> = {
  bad: 'bg-destructive/15 text-destructive',
  mid: 'bg-accent text-accent-foreground',
  ok: 'bg-primary/10 text-primary',
  good: 'bg-primary/20 text-primary',
};
export const TONE_BAR: Record<Band['tone'], string> = {
  bad: 'hsl(var(--destructive) / .55)', mid: 'hsl(var(--chart-4, var(--accent)) / .6)', ok: 'hsl(var(--primary) / .45)', good: 'hsl(var(--primary) / .75)',
};
export const TONE_TEXT: Record<Band['tone'], string> = {
  bad: 'text-destructive', mid: 'text-accent-foreground', ok: 'text-primary', good: 'text-primary',
};
