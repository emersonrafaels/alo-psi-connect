import { useEffect, useState } from "react";
import { getLang, setLang, startAutoTranslate, type Lang } from "./autoTranslate";

const FLAGS: { lang: Lang; flag: string; label: string }[] = [
  { lang: "pt", flag: "🇧🇷", label: "Português" },
  { lang: "en", flag: "🇺🇸", label: "English" },
  { lang: "es", flag: "🇪🇸", label: "Español" },
];

/** Fixed language switcher; translates the whole page automatically. */
export default function LanguageFlags() {
  const [lang] = useState<Lang>(getLang);

  useEffect(() => {
    document.documentElement.lang = lang === "pt" ? "pt-BR" : lang;
    return startAutoTranslate(lang);
  }, [lang]);

  const choose = (l: Lang) => {
    if (l === lang) return;
    setLang(l);
    // Reload restores the original Portuguese DOM before applying the new language.
    window.location.reload();
  };

  return (
    <div
      data-no-translate
      className="fixed top-0 left-1/2 z-[60] flex -translate-x-1/2 gap-0.5 rounded-b-lg border border-t-0 border-border bg-background/90 px-1.5 py-0.5 shadow-sm backdrop-blur"
      role="group"
      aria-label="Idioma / Language"
    >
      {FLAGS.map((f) => (
        <button
          key={f.lang}
          type="button"
          onClick={() => choose(f.lang)}
          title={f.label}
          aria-label={f.label}
          aria-pressed={lang === f.lang}
          className={`rounded px-1 text-base leading-6 transition-opacity ${lang === f.lang ? "opacity-100 ring-1 ring-primary" : "opacity-50 hover:opacity-100"}`}
        >
          {f.flag}
        </button>
      ))}
    </div>
  );
}
