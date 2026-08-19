import { Clock, Headphones, Play, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Practice } from "../domain/types";

export const RecommendationCard = ({
  practice,
  primary,
  selected,
  selectedDuration,
  onSelectPractice,
  onSelectDuration,
  onStart,
}: {
  practice: Practice;
  primary?: boolean;
  selected: boolean;
  selectedDuration: number | null;
  onSelectPractice: () => void;
  onSelectDuration: (minutes: number) => void;
  onStart: () => void;
}) => (
  <Card
    className={cn(
      "overflow-hidden transition-all",
      selected ? "border-primary shadow-lg" : "border-border hover:border-primary/40"
    )}
  >
    <CardContent className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {primary && <Badge className="text-xs">Sugestão principal</Badge>}
            {practice.categoryLabel && (
              <Badge variant="secondary" className="text-xs font-normal">
                {practice.categoryLabel}
              </Badge>
            )}
          </div>
          <h3 className="text-lg font-semibold text-foreground">{practice.title}</h3>
          <p className="text-sm text-muted-foreground">{practice.description}</p>
        </div>
        <span aria-hidden className="text-2xl">
          {practice.icon}
        </span>
      </div>

      {!!practice.benefits?.length && (
        <ul className="flex flex-wrap gap-1.5">
          {practice.benefits.map((b) => (
            <li
              key={b}
              className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
            >
              {b}
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> Escolha a duração
        </p>
        <div className="flex flex-wrap gap-2">
          {practice.durations.map((minutes) => {
            const active = selected && selectedDuration === minutes;
            return (
              <button
                key={minutes}
                type="button"
                onClick={() => {
                  onSelectPractice();
                  onSelectDuration(minutes);
                }}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                )}
              >
                {minutes} min
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {practice.audioAvailable && (
          <span className="flex items-center gap-1">
            <Headphones className="h-3.5 w-3.5" /> Com áudio
          </span>
        )}
        {practice.silentModeAvailable && (
          <span className="flex items-center gap-1">
            <VolumeX className="h-3.5 w-3.5" /> Modo silencioso
          </span>
        )}
      </div>

      <Button
        className="w-full"
        variant={primary ? "default" : "secondary"}
        onClick={() => {
          onSelectPractice();
          onStart();
        }}
      >
        <Play className="mr-2 h-4 w-4" /> Começar prática
      </Button>
    </CardContent>
  </Card>
);
