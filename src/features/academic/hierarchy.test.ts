import { describe, it, expect } from 'vitest';
import { parentLevelFor, normalizeLevels, childrenOf, buildPath, AcademicUnit } from './hierarchy';

describe('academic hierarchy', () => {
  it('full model: turma pertence a turno', () => {
    expect(parentLevelFor('class', ['unit', 'course', 'shift', 'class'])).toBe('shift');
    expect(parentLevelFor('unit', ['unit', 'course', 'shift', 'class'])).toBeNull();
  });
  it('turno > turma: turno é o topo', () => {
    expect(parentLevelFor('shift', ['shift', 'class'])).toBeNull();
    expect(parentLevelFor('class', ['shift', 'class'])).toBe('shift');
  });
  it('somente turma: turma não tem pai', () => {
    expect(parentLevelFor('class', ['class'])).toBeNull();
  });
  it('modelo sem turma volta ao completo', () => {
    expect(normalizeLevels(['unit'])).toEqual(['unit', 'course', 'shift', 'class']);
  });
  it('somente turma lista todas as turmas e caminho só com a turma', () => {
    const units: AcademicUnit[] = [
      { id: 's', institution_id: 'i', parent_id: null, level: 'shift', name: 'Manhã', sort_order: 0 },
      { id: 'c', institution_id: 'i', parent_id: 's', level: 'class', name: 'A', sort_order: 0 },
    ];
    expect(childrenOf('class', null, units, ['class']).map((u) => u.id)).toEqual(['c']);
    expect(buildPath('c', units, ['class']).map((u) => u.name)).toEqual(['A']);
    expect(buildPath('c', units, ['shift', 'class']).map((u) => u.name)).toEqual(['Manhã', 'A']);
  });
});
