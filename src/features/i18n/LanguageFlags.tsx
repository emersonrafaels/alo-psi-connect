import { useEffect } from "react";
import { getLang, setLang, startAutoTranslate, type Lang } from "./autoTranslate";

const FLAGS: { lang: Lang; flag: string; label: string }[] = [
  { lang: "pt", flag: "🇧🇷", label: "Português" },
  { lang: "en", flag: "🇺🇸", label: "English" },
  { lang: "es", flag: "🇪🇸", label: "Español" },
];

/** Mounted once in App: applies the saved language to every page. */
export function AutoTranslateRunner() {
  useEffect(() => {
    const lang = getLang();
    document.documentElement.lang = lang === "pt" ? "pt-BR" : lang;
    return startAutoTranslate(lang);
  }, []);
  return null;
}

/** Inline flag switcher for menus and headers. */
export default function LanguageFlags({ className = "" }: { className?: string }) {
  const lang = getLang();
  const choose = (l: Lang) => {
    if (l === lang) return;
    setLang(l);
    window.location.reload();
  };
  return (
    <div data-no-translate role="group" aria-label="Idioma / Language" className={`flex items-center gap-0.5 ${className}`}>
      {FLAGS.map((f) => (
        <button
          key={f.lang}
          type="button"
          onClick={() => choose(f.lang)}
          title={f.label}
          aria-label={f.label}
          aria-pressed={lang === f.lang}
          className={`rounded px-1 text-lg leading-7 transition-opacity ${lang === f.lang ? "opacity-100 ring-1 ring-current" : "opacity-50 hover:opacity-100"}`}
        >
          {f.flag}
        </button>
      ))}
    </div>
  );
}
