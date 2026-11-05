import { Resend } from 'npm:resend@2.0.0';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { resolveEmailRouting, type EmailSettingRow } from './email-catalog.ts';

async function loadSettings(): Promise<EmailSettingRow[]> {
  try {
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data } = await db.from('email_settings').select('email_key, enabled, site_admin_receives, extra_recipients');
    return (data ?? []) as EmailSettingRow[];
  } catch (e) {
    console.error('[managed-email] settings load failed', e);
    return [];
  }
}

const toList = (to: unknown): string[] => (Array.isArray(to) ? to : to ? [to] : []).map(String);
const mergeBcc = (existing: unknown, extra: string[]) => {
  const all = [...new Set([...toList(existing), ...extra])];
  return all.length ? all : undefined;
};

/** Applies admin-panel email settings to a Resend payload. Returns null when that email is turned off. */
export async function applyEmailSettings<T extends Record<string, unknown>>(key: string, payload: T): Promise<T | null> {
  const { enabled, bcc } = resolveEmailRouting(key, await loadSettings(), toList(payload.to));
  if (!enabled) { console.log(`[managed-email] ${key} disabled, skipped`); return null; }
  return { ...payload, bcc: mergeBcc(payload.bcc, bcc) };
}

/** Drop-in replacement for `new Resend(apiKey)` that honours the admin email settings. */
export function managedResend(key: string, apiKey?: string) {
  const resend = new Resend(apiKey ?? Deno.env.get('RESEND_API_KEY'));
  return {
    emails: {
      send: async (payload: any) => {
        const p = await applyEmailSettings(key, payload);
        return p ? resend.emails.send(p as any) : { data: null, error: null };
      },
    },
    batch: {
      send: async (payloads: any[]) => {
        if (!payloads.length) return resend.batch.send(payloads);
        const first = await applyEmailSettings(key, payloads[0]);
        if (!first) return { data: null, error: null };
        // Admin copy goes only once per batch, not once per recipient.
        return resend.batch.send([first, ...payloads.slice(1)]);
      },
    },
  };
}

/** Drop-in replacement for `fetch('https://api.resend.com/emails', init)` that honours the admin email settings. */
export async function managedEmailFetch(key: string, url: string, init: RequestInit): Promise<Response> {
  try {
    const payload = JSON.parse(String(init.body ?? '{}'));
    const p = await applyEmailSettings(key, payload);
    if (!p) return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    return fetch(url, { ...init, body: JSON.stringify(p) });
  } catch {
    return fetch(url, init);
  }
}
