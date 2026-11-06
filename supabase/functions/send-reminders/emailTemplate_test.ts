import { assert, assertEquals } from 'jsr:@std/assert@1';
import { renderReminderEmail } from './emailTemplate.ts';

const items = [{ type: 'diary' as const, text: 'x <b>' }];

Deno.test('uses saved language for subject and greeting', () => {
  assertEquals(renderReminderEmail({ lang: 'en', name: 'Emerson Rafael', items }).subject, 'Your Rede Bem-Estar reminders');
  assert(renderReminderEmail({ lang: 'es', name: 'Emerson', items }).html.includes('¡Hola, Emerson!'));
});

Deno.test('falls back to Portuguese', () => {
  assertEquals(renderReminderEmail({ lang: null, name: null, items }).subject, 'Seus lembretes da Rede Bem-Estar');
});

Deno.test('escapes reminder text', () => {
  assert(renderReminderEmail({ lang: 'pt', name: '', items }).html.includes('x &lt;b&gt;'));
});
