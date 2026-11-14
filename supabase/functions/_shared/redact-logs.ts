// Side-effect import: masks emails, tokens and links in console output so logs never hold personal data or credentials.
const EMAIL = /([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
const URL_RE = /https?:\/\/[^\s"'<>]+/g;
const LONG_TOKEN = /\b(?:eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|[A-Fa-f0-9]{32,}|[A-Za-z0-9_-]{40,})\b/g;
const SENSITIVE_KEY = /(token|password|senha|secret|link|url|bcc|cc|email|recipient|to|phone|telefone)$/i;

export function redact(v: unknown, depth = 0): unknown {
  if (typeof v === "string") {
    return v.replace(URL_RE, (u) => u.split(/[?#]/)[0].replace(/\/[^/]{16,}$/, "/[redacted]"))
      .replace(EMAIL, "$1***@$2").replace(LONG_TOKEN, "[redacted]");
  }
  if (!v || typeof v !== "object" || depth > 4) return v;
  if (v instanceof Error) return redact(v.message, depth + 1);
  if (Array.isArray(v)) return v.map((x) => redact(x, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    out[k] = SENSITIVE_KEY.test(k) ? "[redacted]" : redact(val, depth + 1);
  }
  return out;
}

const g = globalThis as unknown as { __logsRedacted?: boolean };
if (!g.__logsRedacted) {
  g.__logsRedacted = true;
  for (const m of ["log", "info", "warn", "error", "debug"] as const) {
    const orig = console[m].bind(console);
    console[m] = (...args: unknown[]) => orig(...args.map((a) => redact(a)));
  }
}
