import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { resolveEmailRouting } from './email-catalog.ts';

const site = { email_key: '_site_admin', enabled: true, site_admin_receives: true, extra_recipients: ['admin@rbe.com'] };

Deno.test('site admin copied when toggle on', () => {
  const r = resolveEmailRouting('message', [site, { email_key: 'message', enabled: true, site_admin_receives: true, extra_recipients: [] }]);
  assertEquals(r.bcc, ['admin@rbe.com']);
});
Deno.test('site admin not copied when toggle off, extras still copied', () => {
  const r = resolveEmailRouting('message', [site, { email_key: 'message', enabled: true, site_admin_receives: false, extra_recipients: ['x@y.com'] }]);
  assertEquals(r.bcc, ['x@y.com']);
});
Deno.test('disabled email is not sent', () => {
  assertEquals(resolveEmailRouting('message', [site, { email_key: 'message', enabled: false, site_admin_receives: false, extra_recipients: [] }]).enabled, false);
});
Deno.test('essential email always sent', () => {
  assertEquals(resolveEmailRouting('password-reset', [{ email_key: 'password-reset', enabled: false, site_admin_receives: false, extra_recipients: [] }]).enabled, true);
});
Deno.test('default admin copy for support request without saved row', () => {
  assertEquals(resolveEmailRouting('support-request', [site]).bcc, ['admin@rbe.com']);
});
Deno.test('no duplicate when admin already a direct recipient', () => {
  assertEquals(resolveEmailRouting('support-request', [site], ['Admin@rbe.com']).bcc, []);
});
