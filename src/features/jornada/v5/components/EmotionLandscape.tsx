import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFamilyOf } from "../../config/emotion-taxonomy";
import { V5_COPY } from "../copy";
import type { LandscapeBubble } from "../useV5Signals";

/** Paisagem Emocional: tamanho = frequência, cor = intensidade média, contorno = hoje. */
export const EmotionLandscape = ({
  bubbles,
  todayIds,
  isLoading,
}: {
  bubbles: LandscapeBubble[];
  todayIds: string[];
  isLoading?: boolean;
}) => {
  const items = [...bubbles].sort((a, b) => b.occurrences - a.occurrences).slice(0, 18);
  const maxOccurrences = Math.max(1, ...items.map((item) => item.occurrences));

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold text-foreground">
            {V5_COPY.record.landscapeTitle}
          </h3>
          <p className="text-sm text-muted-foreground">{V5_COPY.record.landscapeDescription}</p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando sua paisagem…</p>
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Sua Paisagem Emocional começa a se formar a partir dos seus registros. Este é o primeiro
            passo.
          </p>
        ) : (
          <ul className="flex flex-wrap items-end gap-3">
            {items.map((item) => {
              const family = getFamilyOf(item.emotion_id);
              const color = family?.color ?? "hsl(var(--primary))";
              const scale = 0.55 + (item.occurrences / maxOccurrences) * 0.45;
              const opacity = 0.25 + ((item.avg_intensity ?? 3) / 5) * 0.6;
              const isToday = todayIds.includes(item.emotion_id);
              return (
                <li key={item.emotion_id}>
                  <span
                    className="flex flex-col items-center justify-center rounded-full border-2 px-3 text-center"
                    style={{
                      backgroundColor: color,
                      opacity,
                      borderColor: isToday ? "hsl(var(--foreground))" : "transparent",
                      minWidth: `${Math.round(76 * scale)}px`,
                      minHeight: `${Math.round(76 * scale)}px`,
                    }}
                    title={`${item.label} · ${item.occurrences} ocorrência(s)`}
                  >
                    <span className="text-[11px] font-semibold leading-tight text-background">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-background/90">{item.occurrences}×</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <ul className="flex flex-wrap gap-2">
          {V5_COPY.record.legend.map((legend) => (
            <li key={legend}>
              <Badge variant="secondary" className="rounded-full text-xs font-normal">
                {legend}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
