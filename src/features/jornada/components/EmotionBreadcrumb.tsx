import { ChevronRight } from "lucide-react";
import { getEmotionNode } from "../config/emotion-taxonomy";

export const EmotionBreadcrumb = ({
  ids,
  onSelect,
}: {
  ids: (string | null)[];
  onSelect?: (id: string) => void;
}) => {
  const nodes = ids.map((id) => getEmotionNode(id)).filter(Boolean);
  if (!nodes.length) return null;

  return (
    <nav aria-label="Caminho da emoção" className="flex flex-wrap items-center gap-1 text-sm">
      {nodes.map((node, i) => (
        <span key={node!.id} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          <button
            type="button"
            onClick={() => onSelect?.(node!.id)}
            className="rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground transition-colors hover:bg-secondary/70"
          >
            {node!.label}
          </button>
        </span>
      ))}
    </nav>
  );
};
