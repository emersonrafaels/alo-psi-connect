import { describe, it, expect } from 'vitest';
import { applyTemplate, getTemplatesForRisk, riskLevelLabel, TRIAGE_NOTE_TEMPLATES } from './triageNoteTemplates';

describe('getTemplatesForRisk', () => {
  it('maps every triage risk level to its own templates', () => {
    expect(getTemplatesForRisk('critical')).toEqual(TRIAGE_NOTE_TEMPLATES.critico);
    expect(getTemplatesForRisk('alert')).toEqual(TRIAGE_NOTE_TEMPLATES.alto);
    expect(getTemplatesForRisk('attention')).toEqual(TRIAGE_NOTE_TEMPLATES.moderado);
    expect(getTemplatesForRisk('healthy')).toEqual(TRIAGE_NOTE_TEMPLATES.baixo);
    expect(getTemplatesForRisk('no_data')).toEqual(TRIAGE_NOTE_TEMPLATES.sem_dados);
  });
  it('labels levels with the badge wording', () => {
    expect(riskLevelLabel('critical')).toBe('Em Risco');
    expect(riskLevelLabel('alert')).toBe('Alerta');
  });
});

describe('applyTemplate', () => {
  const t = TRIAGE_NOTE_TEMPLATES.critico[0];
  it('opens an empty note with the reasons', () => {
    expect(applyTemplate('', t, ['Humor muito baixo', 'Ansiedade muito alta']))
      .toBe(`Motivo: Humor muito baixo · Ansiedade muito alta\n${t.content}`);
  });
  it('appends to an existing note instead of replacing it', () => {
    expect(applyTemplate('Aluno faltou às aulas.\n', t)).toBe(`Aluno faltou às aulas.\n\n${t.content}`);
  });
  it('does not add the same template twice', () => {
    const once = applyTemplate('', t);
    expect(applyTemplate(once, t)).toBe(once);
  });
});
