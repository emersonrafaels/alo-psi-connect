// Branded reminder email, following the Rede Bem-Estar message email layout.
import type { ReminderItem } from './rules.ts';

const PRIMARY = '#5B218E';
const SITE = 'https://redebemestar.com.br';
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);

const L = {
  pt: { subject: 'Seus lembretes da Rede Bem-Estar', header: 'Seus lembretes', hi: (n: string) => n ? `Olá, ${n}!` : 'Olá!', intro: 'Separamos alguns lembretes para você continuar cuidando de si:', btn: { diary: 'Registrar agora', radar: 'Responder Radar', session: 'Ver encontro' }, cta: 'Abrir Meu espaço', privacy: '🔒 Seus registros são confidenciais. A instituição vê apenas resultados coletivos, nunca suas respostas individuais.', off: 'Você pode ajustar ou desligar estes lembretes no Meu espaço.', manage: 'Gerenciar lembretes', rights: 'Todos os direitos reservados.' },
  en: { subject: 'Your Rede Bem-Estar reminders', header: 'Your reminders', hi: (n: string) => n ? `Hi, ${n}!` : 'Hi!', intro: 'Here are a few reminders to help you keep taking care of yourself:', btn: { diary: 'Write an entry', radar: 'Answer the Radar', session: 'View session' }, cta: 'Open My space', privacy: '🔒 Your entries are confidential. Your institution only sees group results, never your individual answers.', off: 'You can adjust or turn off these reminders in My space.', manage: 'Manage reminders', rights: 'All rights reserved.' },
  es: { subject: 'Tus recordatorios de Rede Bem-Estar', header: 'Tus recordatorios', hi: (n: string) => n ? `¡Hola, ${n}!` : '¡Hola!', intro: 'Te dejamos algunos recordatorios para que sigas cuidándote:', btn: { diary: 'Registrar ahora', radar: 'Responder Radar', session: 'Ver encuentro' }, cta: 'Abrir Mi espacio', privacy: '🔒 Tus registros son confidenciales. La institución solo ve resultados colectivos, nunca tus respuestas individuales.', off: 'Puedes ajustar o desactivar estos recordatorios en Mi espacio.', manage: 'Gestionar recordatorios', rights: 'Todos los derechos reservados.' },
};
const ICON = { diary: '📝', radar: '🧭', session: '📅' };
const LINK = { diary: `${SITE}/diario-emocional/nova-entrada`, radar: `${SITE}/radar-permanencia`, session: `${SITE}/encontros` };

export const reminderLang = (l: string | null | undefined) => (l === 'en' || l === 'es') ? l : 'pt';

export function renderReminderEmail(o: { lang: string | null | undefined; name: string | null | undefined; items: ReminderItem[] }) {
  const t = L[reminderLang(o.lang)];
  const first = (o.name ?? '').trim().split(/\s+/)[0] ?? '';
  const year = new Date().getFullYear();
  const cards = o.items.map((i) => `
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px 18px;margin:0 0 12px 0">
        <p style="margin:0 0 10px 0;font-size:16px;color:#1f2937"><span style="font-size:20px;margin-right:8px">${ICON[i.type]}</span>${esc(i.text)}</p>
        <a href="${LINK[i.type]}" style="color:${PRIMARY};font-weight:600;font-size:14px;text-decoration:none">${t.btn[i.type]} →</a>
      </div>`).join('');
  const html = `<!DOCTYPE html><html lang="${reminderLang(o.lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${t.subject}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#1f2937;margin:0;padding:24px 0;background-color:#f8fafc">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)">
    <div style="background:linear-gradient(135deg,${PRIMARY} 0%,${PRIMARY}dd 100%);padding:32px 20px;text-align:center">
      <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:bold">Rede Bem-Estar</h1>
      <p style="color:rgba(255,255,255,0.9);margin:8px 0 0 0;font-size:15px">${t.header}</p>
    </div>
    <div style="padding:36px 24px">
      <h2 style="color:${PRIMARY};margin:0 0 12px 0;font-size:22px">${esc(t.hi(first))}</h2>
      <p style="margin:0 0 20px 0;font-size:16px;color:#4b5563">${t.intro}</p>
      ${cards}
      <div style="text-align:center;margin:28px 0">
        <a href="${SITE}/meu-espaco" style="display:inline-block;background:${PRIMARY};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px">${t.cta}</a>
      </div>
      <div style="background:#f1f5f9;padding:16px 20px;border-radius:8px;border-left:4px solid ${PRIMARY}">
        <p style="margin:0;font-size:14px;color:#4b5563">${t.privacy}</p>
      </div>
    </div>
    <div style="background:#f8fafc;padding:20px 24px;text-align:center;border-top:1px solid #e5e7eb">
      <p style="margin:0 0 6px 0;font-size:13px;color:#6b7280">${t.off} <a href="${SITE}/meu-espaco" style="color:${PRIMARY}">${t.manage}</a></p>
      <p style="margin:0;font-size:12px;color:#9ca3af">© ${year} Rede Bem-Estar. ${t.rights}</p>
    </div>
  </div>
</body></html>`;
  const text = `${t.hi(first)}\n\n${t.intro}\n\n${o.items.map((i) => `- ${i.text} ${LINK[i.type]}`).join('\n')}\n\n${t.cta}: ${SITE}/meu-espaco\n\n${t.off}`;
  return { subject: t.subject, html, text };
}
