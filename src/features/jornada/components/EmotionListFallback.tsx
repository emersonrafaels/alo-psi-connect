import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SELECTABLE_EMOTIONS, getFamilyOf } from "../config/emotion-taxonomy";

/** Alternativa acessível à Roda: taxonomia completa em lista com busca. */
export const EmotionListFallback = ({
  onSelect,
}: {
  onSelect: (emotionId: string) => void;
}) => {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (!q) return SELECTABLE_EMOTIONS;
    return SELECTABLE_EMOTIONS.filter((n) =>
      n.label
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .includes(q)
    );
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar uma palavra (ex.: sobrecarregado)"
          aria-label="Buscar emoção na lista"
          className="pl-9"
        />
      </div>

      <ul className="grid max-h-[420px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {results.map((node) => {
          const family = getFamilyOf(node.id);
          return (
            <li key={node.id}>
              <button
                type="button"
                onClick={() => onSelect(node.id)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: family?.color }}
                  />
                  <span className="font-medium text-foreground">{node.label}</span>
                </span>
                <Badge variant="secondary" className="shrink-0 text-xs font-normal">
                  {family?.label} · nível {node.level}
                </Badge>
              </button>
            </li>
          );
        })}
        {!results.length && (
          <li className="text-sm text-muted-foreground">
            Nenhuma palavra encontrada. Você pode escolher a família mais próxima na Roda.
          </li>
        )}
      </ul>
    </div>
  );
};
