import { Heart, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SupportIcon } from "./SupportIcon";
import type { SupportItem } from "./types";

interface Props {
  item: SupportItem;
  isFavorite: boolean;
  inPlan: boolean;
  onOpen: () => void;
  onToggleFavorite: () => void;
  onTogglePlan: () => void;
}

export const SupportCard = ({
  item,
  isFavorite,
  inPlan,
  onOpen,
  onToggleFavorite,
  onTogglePlan,
}: Props) => {
  const isInstitution = item.origin === "institution";

  return (
    <Card className="flex flex-col p-5 h-full transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "h-12 w-12 rounded-2xl grid place-items-center shrink-0",
            isInstitution ? "bg-secondary/15 text-secondary" : "bg-primary/10 text-primary"
          )}
        >
          <SupportIcon name={item.icon} className="h-6 w-6" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
          onClick={onToggleFavorite}
          className={cn("shrink-0", isFavorite && "text-primary")}
        >
          <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
        </Button>
      </div>

      <Badge
        variant="secondary"
        className={cn(
          "mt-3 w-max text-[10px] font-semibold",
          isInstitution ? "bg-secondary/15 text-secondary" : "bg-primary/10 text-primary"
        )}
      >
        {item.originLabel}
      </Badge>

      <h3 className="mt-2 text-base font-semibold leading-snug">{item.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{item.description}</p>

      <div className="mt-auto pt-4 flex flex-wrap gap-1.5">
        <span className="text-[10px] px-2 py-1 rounded-md bg-muted text-muted-foreground">
          {item.category}
        </span>
        <span className="text-[10px] px-2 py-1 rounded-md bg-muted text-muted-foreground">
          {item.format}
        </span>
        <span className="text-[10px] px-2 py-1 rounded-md bg-muted text-muted-foreground">
          {item.accessType}
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onOpen}>
          Ver detalhes
        </Button>
        <Button
          size="icon"
          variant={inPlan ? "secondary" : "default"}
          aria-label={inPlan ? "Remover do meu plano" : "Adicionar ao meu plano"}
          onClick={onTogglePlan}
        >
          {inPlan ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>
    </Card>
  );
};
