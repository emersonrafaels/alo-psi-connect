import { describe, expect, it } from 'vitest';
import { canSend, expandUnits } from '../../../supabase/functions/send-message/audience';

const inst = { isPlatformAdmin: false, institutionIds: ['afya'] };
const admin = { isPlatformAdmin: true, institutionIds: [] };

describe('quem pode enviar para quem', () => {
  it('admin envia para todos, instituições e usuários', () => {
    expect(canSend(admin, { kind: 'all' })).toBe(true);
    expect(canSend(admin, { kind: 'institutions' })).toBe(true);
    expect(canSend(admin, { kind: 'users', userIds: ['u'] })).toBe(true);
  });
  it('instituição não envia para todos nem para instituições', () => {
    expect(canSend(inst, { kind: 'all' })).toBe(false);
    expect(canSend(inst, { kind: 'institutions' })).toBe(false);
    expect(canSend(inst, { kind: 'users', userIds: ['u'] })).toBe(false);
  });
  it('instituição envia só para alunos da própria instituição', () => {
    expect(canSend(inst, { kind: 'students', institutionId: 'afya' })).toBe(true);
    expect(canSend(inst, { kind: 'units', institutionId: 'outra', unitIds: ['x'] })).toBe(false);
  });
});

describe('escolha por unidade/curso/turno/turma', () => {
  const units = [
    { id: 'unidade', parent_id: null },
    { id: 'curso', parent_id: 'unidade' },
    { id: 'turno', parent_id: 'curso' },
    { id: 'turma1', parent_id: 'turno' },
    { id: 'turma2', parent_id: 'turno' },
    { id: 'outra', parent_id: null },
  ];
  it('escolher a unidade inclui todas as turmas abaixo dela', () => {
    expect([...expandUnits(['unidade'], units)].sort()).toEqual(['curso', 'turma1', 'turma2', 'turno', 'unidade']);
  });
  it('escolher uma turma inclui só ela', () => {
    expect([...expandUnits(['turma1'], units)]).toEqual(['turma1']);
  });
});

import { emailableRecipients } from '../../../supabase/functions/send-message/audience';
describe('emailableRecipients', () => {
  const cases = [{ user_id: 'a', notifications_blocked: false }, { user_id: 'b', notifications_blocked: true }];
  it('emails an activated study case even in a demo institution', () => {
    expect(emailableRecipients(['a'], cases, true)).toEqual(['a']);
  });
  it('never emails blocked study cases', () => {
    expect(emailableRecipients(['b'], cases, false)).toEqual([]);
  });
  it('never emails other students of a demo institution', () => {
    expect(emailableRecipients(['x'], cases, true)).toEqual([]);
    expect(emailableRecipients(['x'], cases, false)).toEqual(['x']);
  });
});
