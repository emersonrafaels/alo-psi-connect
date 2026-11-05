import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { isEmailBlocked } from './rules.ts';

Deno.test('real student in demo institution gets email', () => assertEquals(isEmailBlocked(false, null), false));
Deno.test('activated study case gets email', () => assertEquals(isEmailBlocked(false, { notifications_blocked: false }), false));
Deno.test('blocked study case gets no email', () => assertEquals(isEmailBlocked(false, { notifications_blocked: true }), true));
Deno.test('synthetic request gets no email', () => assertEquals(isEmailBlocked(true, null), true));
