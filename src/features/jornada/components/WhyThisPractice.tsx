import { Check, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useCurator } from "../hooks/useCurator";
import type { Practice } from "../domain/types";

/** Justificativa determinística da recomendação + bloco de curadoria. */
export const WhyThisPractice = ({
  practice,
  emotionLabel,
  intensity,
  needLabel,
}: {
  practice: Practice;
  emotionLabel: string;
  intensity: number;
  needLabel?: string | null;
}) => {
  const curator = useCurator();

  return (
    <Card className="border-border/70 bg-muted/30">
      <CardContent className="space-y-5 p-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </span>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Por que recomendamos isso?</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A recomendação considera a emoção escolhida (<strong>{emotionLabel}</strong>), a
            intensidade <strong>{intensity}/5</strong>
            {needLabel ? (
              <>
                {" "}
                e o que você indicou precisar agora: <strong>{needLabel.toLowerCase()}</strong>.
              </>
            ) : (
              " e a forma como este momento está aparecendo para você."
            )}
          </p>
        </div>

        {!!practice.benefits?.length && (
          <ul className="space-y-2">
            {practice.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-sm text-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {benefit}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-3 border-t border-border/70 pt-4">
          <Avatar className="h-11 w-11">
            <AvatarImage src={curator.photoUrl} alt={curator.displayName} />
            <AvatarFallback className="text-xs">{curator.initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Curadoria das práticas
            </p>
            <p className="text-sm font-semibold text-foreground">{curator.displayName}</p>
            <p className="text-xs leading-snug text-muted-foreground">{curator.note}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
