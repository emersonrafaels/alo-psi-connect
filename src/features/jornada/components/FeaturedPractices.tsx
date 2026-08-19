import { Clock, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PRACTICES } from "../config/practices";
import type { PracticeStat } from "../hooks/useJourneySignals";

interface FeaturedPracticesProps {
  stats: PracticeStat[];
  curatorName: string;
  onPick?: (practiceId: string) => void;
}

export const FeaturedPractices = ({ stats, curatorName, onPick }: FeaturedPracticesProps) => {
  const active = PRACTICES.filter((practice) => practice.status === "active").slice(0, 6);
  const statOf = (id: string) => stats.find((stat) => stat.practice_id === id);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {active.map((practice) => {
        const stat = statOf(practice.id);
        return (
          <Card
            key={practice.id}
            role={onPick ? "button" : undefined}
            tabIndex={onPick ? 0 : undefined}
            onClick={() => onPick?.(practice.id)}
            onKeyDown={(event) => {
              if (onPick && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                onPick(practice.id);
              }
            }}
            className="group h-full border-border/70 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <CardContent className="flex h-full flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="secondary" className="rounded-full text-xs font-normal">
                  {practice.categoryLabel}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {practice.durations[0]}–{practice.durations[practice.durations.length - 1]} min
                </span>
              </div>

              <h3 className="text-base font-semibold text-foreground">{practice.title}</h3>
              <p className="line-clamp-3 text-sm text-muted-foreground">{practice.description}</p>

              <div className="mt-auto space-y-2 pt-2">
                {stat?.relief_rate != null && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Users className="h-3.5 w-3.5" />
                    {stat.relief_rate}% sentiram alívio ({stat.sessions} sessões)
                  </p>
                )}
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  Curadoria de {curatorName}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
