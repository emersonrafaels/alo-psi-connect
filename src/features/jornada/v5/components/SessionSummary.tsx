import { Check, Loader2, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getEmotionNode, getFamilyOf } from "../../config/emotion-taxonomy";
import { INTENSITY_LABELS, USEFULNESS_LABELS } from "../../config/perceived-change-options";
import { getPractice } from "../../config/practices";
import { V5_COPY } from "../copy";
import type { V5State } from "../types";

const dimensionLabels: Record<string, string> = {
  situation: "Situação",
  body: "Corpo",
  behavior: "Comportamento",
  thoughts: "Pensamentos",
};

/** Resumo do registro concluído, com salvamento na Minha Jornada. */
export const SessionSummary = ({
  state,
  saving,
  saved,
  saveError,
  onSave,
  onRestart,
}: {
  state: V5State;
  saving: boolean;
  saved: boolean;
  saveError: string | null;
  onSave: () => void;
  onRestart: () => void;
}) => {
  const practice = getPractice(state.learning.practiceId ?? "");
  const comprehension = (["situation", "body", "behavior", "thoughts"] as const).filter(
    (key) => !!state.comprehension[key]
  );

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="space-y-6 p-5 sm:p-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {V5_COPY.record.eyebrow}
          </p>
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            {V5_COPY.record.title}
          </h2>
          <p className="max-w-3xl text-sm text-muted-foreground">{V5_COPY.record.description}</p>
        </div>

        <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/25 p-5">
          <h3 className="text-sm font-semibold text-foreground">Emoções registradas</h3>
          <ul className="grid gap-2 sm:grid-cols-3">
            {state.emotions.map((item) => {
              const node = getEmotionNode(item.emotionId);
              const family = getFamilyOf(item.emotionId);
              return (
                <li
                  key={item.emotionId}
                  className="rounded-2xl border border-border/70 bg-card p-3"
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: family?.color ?? "hsl(var(--primary))" }}
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {node?.label ?? item.emotionId}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Antes: {item.intensityBefore} · {INTENSITY_LABELS[item.intensityBefore]}
                    {item.intensityAfter != null && (
                      <> · Depois da pausa: {item.intensityAfter}</>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted-foreground">{V5_COPY.record.occurrenceNote}</p>
        </div>

        {comprehension.length > 0 && (
          <div className="space-y-3 rounded-2xl border border-border/70 p-5">
            <h3 className="text-sm font-semibold text-foreground">Panorama do momento</h3>
            <dl className="grid gap-3 sm:grid-cols-2">
              {comprehension.map((key) => (
                <div key={key}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {dimensionLabels[key]}
                  </dt>
                  <dd className="text-sm text-foreground">{state.comprehension[key]}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {(practice || state.learning.skipped) && (
          <div className="space-y-2 rounded-2xl border border-border/70 p-5">
            <h3 className="text-sm font-semibold text-foreground">Recurso desta jornada</h3>
            {practice ? (
              <p className="text-sm text-muted-foreground">
                {practice.title}
                {state.learning.durationMinutes ? ` · ${state.learning.durationMinutes} min` : ""}
                {state.learning.completed ? " · concluída" : " · não concluída"}
                {state.learning.utility != null &&
                  ` · ${USEFULNESS_LABELS[state.learning.utility]}`}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Você seguiu sem praticar. Isso também é uma escolha válida.
              </p>
            )}
          </div>
        )}

        {(state.action.next || state.action.status) && (
          <div className="space-y-2 rounded-2xl border border-primary/25 bg-primary/5 p-5">
            <h3 className="text-sm font-semibold text-foreground">{V5_COPY.act.stepTitle}</h3>
            {state.action.next ? (
              <p className="text-sm text-foreground">{state.action.next}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sem ação definida neste registro.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {state.action.when && (
                <Badge variant="secondary" className="rounded-full text-xs font-normal">
                  {V5_COPY.act.whenOptions.find((option) => option.id === state.action.when)?.label}
                </Badge>
              )}
              {state.action.status && state.action.status !== "defined" && (
                <Badge variant="secondary" className="rounded-full text-xs font-normal">
                  {
                    V5_COPY.act.statusOptions.find((option) => option.id === state.action.status)
                      ?.label
                  }
                </Badge>
              )}
            </div>
          </div>
        )}

        {saveError && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{saveError}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={onSave} disabled={saving || saved}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saved ? "Registro salvo" : V5_COPY.record.save}
          </Button>
          <Button variant="outline" asChild>
            <Link to="/agendar">
              <ShieldCheck className="mr-2 h-4 w-4" />
              {V5_COPY.record.support}
            </Link>
          </Button>
          <Button variant="ghost" onClick={onRestart}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {V5_COPY.record.again}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
