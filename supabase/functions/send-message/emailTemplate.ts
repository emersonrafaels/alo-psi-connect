const PRIMARY = '#5B218E';
const SITE = 'https://redebemestar.com.br';

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** Escapes text, turns URLs into links and keeps paragraph breaks. */
export function bodyToHtml(body: string): string {
  return body.trim().split(/\n{2,}/).map((para) => {
    const html = escapeHtml(para)
      .replace(/(https?:\/\/[^\s<]+)/g, (u) => `<a href="${u}" style="color:${PRIMARY};font-weight:600;word-break:break-all">${u}</a>`)
      .replace(/\n/g, '<br>');
    return `<p style="margin:0 0 16px 0;font-size:16px;color:#4b5563;line-height:1.6">${html}</p>`;
  }).join('');
}

export function renderMessageEmail(o: { subject: string; body: string; senderName: string; fromInstitution: boolean }) {
  const year = new Date().getFullYear();
  const privacy = o.fromInstitution ? `
    <div style="background:#f1f5f9;padding:16px 20px;border-radius:8px;margin:24px 0;border-left:4px solid ${PRIMARY}">
      <p style="margin:0;font-size:14px;color:#4b5563">🔒 Você pode responder anonimamente. A instituição não tem acesso aos seus dados do diário, escalas ou práticas.</p>
    </div>` : '';
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(o.subject)}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#1f2937;margin:0;padding:24px 0;background-color:#f8fafc">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)">
    <div style="background:linear-gradient(135deg,${PRIMARY} 0%,${PRIMARY}dd 100%);padding:32px 20px;text-align:center">
      <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:bold">Rede Bem-Estar</h1>
      <p style="color:rgba(255,255,255,0.9);margin:8px 0 0 0;font-size:15px">Mensagem de ${escapeHtml(o.senderName)}</p>
    </div>
    <div style="padding:36px 24px">
      <h2 style="color:${PRIMARY};margin:0 0 20px 0;font-size:22px">${escapeHtml(o.subject)}</h2>
      <p style="margin:0 0 16px 0;font-size:16px;color:#4b5563">Olá!</p>
      ${bodyToHtml(o.body)}
      ${privacy}
      <div style="text-align:center;margin:32px 0 8px 0">
        <a href="${SITE}/mensagens" style="display:inline-block;background:${PRIMARY};color:#ffffff;text-decoration:none;padding:14px 30px;border-radius:6px;font-weight:bold;font-size:16px">Ver e responder no site</a>
      </div>
      <div style="border-top:2px solid #e5e7eb;margin-top:32px;padding-top:20px">
        <p style="margin:0;font-size:14px;color:#6b7280;text-align:center">Atenciosamente,<br><strong style="color:${PRIMARY}">Equipe ${escapeHtml(o.senderName)}</strong></p>
      </div>
    </div>
    <div style="background-color:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:12px;color:#9ca3af">Conectando você ao cuidado<br>Este é um email automático, por favor não responda.<br>© ${year} Rede Bem-Estar. Todos os direitos reservados.</p>
    </div>
  </div>
</body></html>`;
  const text = `${o.subject}\n\nOlá!\n\n${o.body}\n\n${o.fromInstitution ? 'Você pode responder anonimamente. A instituição não tem acesso aos seus dados do diário, escalas ou práticas.\n\n' : ''}Ver e responder no site: ${SITE}/mensagens\n\nRede Bem-Estar · Conectando você ao cuidado`;
  return { html, text };
}
