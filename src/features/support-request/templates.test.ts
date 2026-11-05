import { describe, expect, it } from 'vitest';
import { applyTemplate, SUPPORT_MESSAGE_MAX } from './templates';

describe('applyTemplate', () => {
  it('fills an empty message with the template', () => {
    expect(applyTemplate('', 'Prefiro explicar em uma conversa.')).toBe('Prefiro explicar em uma conversa.');
  });
  it('appends to what the student already wrote', () => {
    expect(applyTemplate('Oi', 'Texto')).toBe('Oi\nTexto');
  });
  it('does not duplicate a template already present', () => {
    expect(applyTemplate('Oi\nTexto', 'Texto')).toBe('Oi\nTexto');
  });
  it('never exceeds 1000 characters', () => {
    expect(applyTemplate('a'.repeat(999), 'Texto').length).toBe(SUPPORT_MESSAGE_MAX);
  });
});
