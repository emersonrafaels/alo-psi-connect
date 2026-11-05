import type { Lang } from "./autoTranslate";

const Brazil = () => (
  <svg viewBox="0 0 28 20" aria-hidden="true">
    <rect width="28" height="20" fill="#009C3B" />
    <path d="M14 2.5 25.5 10 14 17.5 2.5 10z" fill="#FFDF00" />
    <circle cx="14" cy="10" r="4.4" fill="#002776" />
    <path d="M9.8 9.2c2.8-.5 5.8.1 8.3 1.6" stroke="#fff" strokeWidth=".8" fill="none" />
  </svg>
);

const USA = () => (
  <svg viewBox="0 0 28 20" aria-hidden="true">
    <rect width="28" height="20" fill="#fff" />
    {[0, 2, 4, 6, 8, 10, 12].map((i) => (
      <rect key={i} y={(i * 20) / 13} width="28" height={20 / 13} fill="#B22234" />
    ))}
    <rect width="12" height={(20 / 13) * 7} fill="#3C3B6E" />
    {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => (
      <circle key={`${r}${c}`} cx={1.8 + c * 2.8} cy={1.8 + r * 3.2} r=".55" fill="#fff" />
    )))}
  </svg>
);

const Spain = () => (
  <svg viewBox="0 0 28 20" aria-hidden="true">
    <rect width="28" height="20" fill="#AA151B" />
    <rect y="5" width="28" height="10" fill="#F1BF00" />
    <rect x="6" y="7.5" width="3" height="5" rx=".6" fill="#AA151B" opacity=".85" />
  </svg>
);

export const FLAG_ICONS: Record<Lang, () => JSX.Element> = { pt: Brazil, en: USA, es: Spain };
