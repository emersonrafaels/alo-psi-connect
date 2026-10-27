import { describe, expect, it } from 'vitest';
import { bodyToHtml, renderMessageEmail } from '../../../supabase/functions/send-message/emailTemplate';

describe('message email template', () => {
  it('escapes html in the body', () => {
    expect(bodyToHtml('<script>x</script>')).toContain('&lt;script&gt;');
  });
  it('turns urls into links', () => {
    expect(bodyToHtml('Ver: https://redebemestar.com.br/biblioteca-apoios')).toContain('<a href="https://redebemestar.com.br/biblioteca-apoios"');
  });
  it('shows privacy note only for institution messages', () => {
    expect(renderMessageEmail({ subject: 's', body: 'b', senderName: 'Afya', fromInstitution: true }).html).toContain('responder anonimamente');
    expect(renderMessageEmail({ subject: 's', body: 'b', senderName: 'Rede Bem-Estar', fromInstitution: false }).html).not.toContain('responder anonimamente');
  });
});
