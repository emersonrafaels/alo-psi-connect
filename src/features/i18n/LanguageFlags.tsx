import { useEffect, useSyncExternalStore } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getLangState, setLanguage, startAutoTranslate, startProfileLangSync, subscribeLang, type Lang } from "./autoTranslate";
import { FLAG_ICONS } from "./flags";

const FLAGS: { lang: Lang; label: string }[] = [
  { lang: "pt", label: "Português" },
  { lang: "en", label: "English" },
  { lang: "es", label: "Español" },
];

/** Mounted once in App: observes the page and applies the chosen language. */
export function AutoTranslateRunner() {
  useEffect(() => { startProfileLangSync(); return startAutoTranslate(); }, []);
  return null;
}

/** Select-style language switcher: shows only the current flag; opens a list on click. */
export default function LanguageFlags({ className = "" }: { className?: string }) {
  const { lang, loading } = useSyncExternalStore(subscribeLang, getLangState);
  const current = FLAGS.find((f) => f.lang === lang) ?? FLAGS[0];
  const CurrentIcon = FLAG_ICONS[current.lang];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-no-translate
          role="group"
          aria-label={`Idioma atual: ${current.label}. Abrir lista de idiomas`}
          aria-haspopup="listbox"
          title={current.label}
          className={cn(
            "flex items-center gap-1 rounded-full p-1.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            loading && "animate-pulse",
          )}
        >
          <span className="block h-4 w-6 overflow-hidden rounded-[3px] [&>svg]:h-full [&>svg]:w-full">
            <CurrentIcon />
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" role="listbox" aria-label="Idioma / Language" className="min-w-[10rem]">
        {FLAGS.map((f) => {
          const Icon = FLAG_ICONS[f.lang];
          const active = lang === f.lang;
          return (
            <DropdownMenuItem
              key={f.lang}
              role="option"
              aria-selected={active}
              onSelect={() => setLanguage(f.lang)}
              className="flex items-center gap-2.5"
            >
              <span className="block h-4 w-6 overflow-hidden rounded-[3px] shadow-sm [&>svg]:h-full [&>svg]:w-full">
                <Icon />
              </span>
              <span className={cn("text-sm", active && "font-semibold")}>{f.label}</span>
              {active && <Check className="ml-auto h-4 w-4 opacity-70" aria-hidden="true" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
