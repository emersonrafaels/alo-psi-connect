// Builds a single-event .ics file (local wall-clock time, 1h default duration).
const pad = (n: number) => String(n).padStart(2, '0');
const stamp = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const esc = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');

export function buildIcs(ev: { uid: string; title: string; start: Date; minutes?: number; url?: string | null }): string {
  const end = new Date(ev.start.getTime() + (ev.minutes ?? 60) * 60_000);
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Rede Bem-Estar//PT', 'BEGIN:VEVENT',
    `UID:${ev.uid}@redebemestar.com.br`, `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(ev.start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${esc(ev.title)}`,
    ...(ev.url ? [`URL:${ev.url}`] : []), 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(name: string, ics: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = `${name.replace(/[^\w-]+/g, '-').slice(0, 40) || 'evento'}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
