import { describe, expect, it } from 'vitest';
import { buildIcs } from './calendar';

describe('buildIcs', () => {
  it('uses start time and 60 minute default end', () => {
    const ics = buildIcs({ uid: 'x', title: 'Roda, conversa', start: new Date(2026, 10, 5, 19, 30) });
    expect(ics).toContain('DTSTART:20261105T193000');
    expect(ics).toContain('DTEND:20261105T203000');
    expect(ics).toContain('SUMMARY:Roda\\, conversa');
  });
});
