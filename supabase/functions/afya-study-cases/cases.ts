export const AFYA_ID = '52edbfee-9645-40ca-967a-b1135f4b6aac';
export const TENANT_ID = '472db0ac-0f45-4998-97da-490bc579efb1';
export const CASES = [
  { key: 'A', name: 'Estudante A', description: 'Rotina equilibrada, bons indicadores e práticas voluntárias.', classId: 'af4f3708-1c1c-4b00-9e4d-9ad6f12f7872' },
  { key: 'B', name: 'Estudante B', description: 'Oscilações durante avaliações, com melhora após práticas e procura de apoio.', classId: '6ba23d14-0a13-4d28-bce4-71a7e0dd5229' },
  { key: 'C', name: 'Estudante C', description: 'Sobrecarga persistente e maior necessidade de acompanhamento; atenção inteiramente simulada.', classId: '6876dee9-3a51-4864-b6c6-d39387a8504e' },
] as const;
export const canManageCases = (roles: string[]) => roles.some(role => role === 'admin' || role === 'super_admin');
export function moodAt(key: string, day: number) {
  if (key === 'A') return { mood: day % 6 === 0 ? 5 : 4, anxiety: day % 7 === 0 ? 2 : 1, energy: 4, sleep: 4 };
  if (key === 'B') return { mood: day < 12 ? 4 : day < 23 ? 2 : 3, anxiety: day < 12 ? 2 : day < 23 ? 4 : 3, energy: day < 12 ? 4 : 3, sleep: day < 12 ? 4 : 2 };
  return { mood: day % 8 === 0 ? 1 : 2, anxiety: day % 6 === 0 ? 4 : 5, energy: 2, sleep: 2 };
}
export function scoredAnswers(key: string, code: string, collection: number, count: number, max: number) {
  const positive = code === 'WHO5' || code === 'MHCSF';
  const good = key === 'A' ? .85 : key === 'B' ? [.55, .35, .65][collection] : [.3, .2, .15][collection];
  const ratio = positive ? good : 1 - good;
  return Array.from({ length: count }, (_, index) => Math.max(0, Math.min(max, Math.round(max * ratio + (index % 3 - 1) * .45))));
}