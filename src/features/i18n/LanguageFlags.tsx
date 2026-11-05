import { useEffect, useSyncExternalStore } from "react";
import { getLangState, setLanguage, startAutoTranslate, subscribeLang, type Lang } from "./autoTranslate";
import { FLAG_ICONS } from "./flags";

const FLAGS: { lang: Lang; label: string }[] = [
  { lang: "pt", label: "Português" },
  { lang: "en", label: "English" },
  { lang: "es", label: "Español" },
];

/** Mounted once in App: observes the page and applies the chosen language. */
export function AutoTranslateRunner() {
  useEffect(() => startAutoTranslate(), []);
  return null;
}

/** Inline flag switcher for menus and headers; switches without reloading. */
export default function LanguageFlags({ className = "" }: { className?: string }) {
  const { lang, loading } = useSyncExternalStore(subscribeLang, getLangState);
  return (
    <div data-no-translate role="group" aria-label="Idioma / Language" className={`flex items-center gap-1 ${className}`}>
      {FLAGS.map((f) => {
        const Icon = FLAG_ICONS[f.lang];
        const active = lang === f.lang;
        return (
          <button
            key={f.lang}
            type="button"
            onClick={() => setLanguage(f.lang)}
            title={f.label}
            aria-label={f.label}
            aria-pressed={active}
            className={`relative h-5 w-7 overflow-hidden rounded-[3px] shadow-sm transition-all duration-200 [&>svg]:h-full [&>svg]:w-full ${
              active ? "scale-110 opacity-100 ring-2 ring-current ring-offset-1 ring-offset-transparent" : "opacity-55 grayscale-[35%] hover:opacity-100 hover:grayscale-0"
            } ${active && loading ? "animate-pulse" : ""}`}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}
