export const SUPPORT_MESSAGE_MAX = 1000;

export const SUPPORT_TEMPLATES: { label: string; text: string }[] = [
  { label: 'Sobrecarga', text: 'Estou me sentindo sobrecarregado(a) e gostaria de conversar.' },
  { label: 'Ansiedade/estresse', text: 'Tenho passado por dificuldades com ansiedade/estresse.' },
  { label: 'Atendimento psicológico', text: 'Gostaria de orientação sobre atendimento psicológico.' },
  { label: 'Estudos', text: 'Estou com dificuldades nos estudos e isso tem me afetado.' },
  { label: 'Prefiro conversar', text: 'Prefiro explicar em uma conversa.' },
];

/** Inserts a template, appending it when the student already wrote something; never exceeds the limit. */
export function applyTemplate(current: string, template: string): string {
  const base = current.trim();
  if (!base || base === template) return template.slice(0, SUPPORT_MESSAGE_MAX);
  if (base.includes(template)) return base;
  return `${base}\n${template}`.slice(0, SUPPORT_MESSAGE_MAX);
}
