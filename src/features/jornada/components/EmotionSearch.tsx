import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SELECTABLE_EMOTIONS, getFamilyOf } from "../config/emotion-taxonomy";

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/** Busca por palavra que acende o caminho correspondente na Roda. */
export const EmotionSearch = ({
  onPick,
}: {
  onPick: (emotionId: string) => void;
}) => {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = normalize(query);
    if (q.length < 2) return [];
    return SELECTABLE_EMOTIONS.filter((node) => normalize(node.label).includes(q)).slice(0, 8);
  }, [query]);

  return (
    <div className="relative mx-auto w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar uma palavra (ex.: sobrecarregado)"
        aria-label="Buscar uma emoção pelo nome"
        className="rounded-full pl-9 pr-9"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label="Limpar busca"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {results.length > 0 && (
        <ul className="absolute z-20 mt-2 w-full space-y-1 rounded-2xl border border-border bg-popover p-2 shadow-lg">
          {results.map((node) => {
            const family = getFamilyOf(node.id);
            return (
              <li key={node.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(node.id);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                >
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: family?.color }}
                    />
                    {node.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{family?.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {query.trim().length >= 2 && results.length === 0 && (
        <p className="absolute z-20 mt-2 w-full rounded-2xl border border-border bg-popover p-3 text-sm text-muted-foreground shadow-lg">
          Não encontrei essa palavra. Escolha na Roda a família mais próxima do que você sente.
        </p>
      )}
    </div>
  );
};
