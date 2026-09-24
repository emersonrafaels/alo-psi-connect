import { useState } from "react";
import { ArrowLeft, ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { V5_COPY } from "../copy";
import type { ComprehensionState } from "../types";
import type { PickedEmotion } from "../types";
import { BodyMap } from "./BodyMap";
import { JourneyGuide } from "./JourneyGuide";

type DimensionKey = "situation" | "body" | "behavior" | "thoughts";
const UNCLEAR_TEXT = "Ainda não consigo identificar.";
const PRIVATE_TEXT = "Prefiro não registrar agora.";

/** Panorama do momento: navegação lateral por dimensão, uma por vez. */
export const ComprehensionDimensions = ({
  value,
  focusLabel,
  onChange,
  onToggleUnclear,
  onSkip,
  onClear,
  onBack,
  onNext,
  emotions,
  onBodyMapChange,
}: {
  value: ComprehensionState;
  focusLabel: string;
  onChange: (key: DimensionKey, text: string) => void;
  onToggleUnclear: (key: string) => void;
  onSkip: () => void;
  onClear: () => void;
  onBack: () => void;
  onNext: () => void;
  emotions: PickedEmotion[];
  onBodyMapChange: (layers: ComprehensionState["bodyLayers"], note?: string, status?: ComprehensionState["bodyMapStatus"]) => void;
}) => {
  const [index, setIndex] = useState(0);
  const dimensions = V5_COPY.comprehend.dimensions;
  const current = dimensions[index];
  const isLast = index === dimensions.length - 1;
  const unclear = value.unclear.includes(current.key);
  const privateChosen = value[current.key as DimensionKey] === PRIVATE_TEXT;
  void onSkip;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)]">
      <Card className="h-max border-border/70 shadow-sm lg:sticky lg:top-24">
        <CardContent className="space-y-2 p-3 sm:p-4">
          {dimensions.map((dimension, i) => {
            const filled =
              !!value[dimension.key as DimensionKey] || value.unclear.includes(dimension.key);
            const active = i === index;
            return (
              <button
                key={dimension.key}
                type="button"
                onClick={() => setIndex(i)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors",
                  active
                    ? "border-primary/40 bg-primary/5"
                    : "border-transparent hover:bg-accent/60"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    active
                      ? "bg-primary text-primary-foreground"
                      : filled
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {i + 1}
                </span>
                <span className="space-y-0.5">
                  <span
                    className={cn(
                      "block text-sm font-semibold leading-tight",
                      active ? "text-primary" : "text-foreground"
                    )}
                  >
                    {dimension.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {filled ? "Registrado" : "Opcional"}
                  </span>
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {current.key === "body" ? (
        <div className="space-y-5">
          <BodyMap
            emotions={emotions}
            layers={value.bodyLayers}
            note={value.bodyNote}
            onChange={(layers) => onBodyMapChange(layers)}
            onNote={(note) => onBodyMapChange(value.bodyLayers, note)}
            onStatus={(status) => onBodyMapChange(status === "mapped" ? value.bodyLayers : [], value.bodyNote, status)}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <Button variant="outline" onClick={() => setIndex(index - 1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button onClick={() => setIndex(index + 1)}>
              Próxima Dimensão
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : <Card className="border-border/70 shadow-sm">
        <CardContent className="space-y-5 p-5 sm:p-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {V5_COPY.comprehend.eyebrow}
            </p>
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">{current.label}</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">{current.help}</p>
            <p className="text-xs text-muted-foreground">
              Foco desta reflexão: <strong className="text-foreground">{focusLabel}</strong>
            </p>
          </div>

          <JourneyGuide title="Observar sem procurar uma resposta certa" text="Uma orientação curta pode ajudar você a usar esta etapa no seu próprio ritmo." />

          <div className="space-y-3">
            <label
              htmlFor="dimension-text"
              className="block text-sm font-semibold text-foreground"
            >
              {current.question}
            </label>
            <Textarea
              id="dimension-text"
              value={value[current.key as DimensionKey]}
              onChange={(event) => onChange(current.key as DimensionKey, event.target.value)}
              placeholder={current.placeholder}
              rows={7}
              className="resize-none bg-card"
            />

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn("rounded-full", unclear && "border-primary bg-primary/10 text-primary")}
                onClick={() => {
                  const key = current.key as DimensionKey;
                  if (unclear) {
                    onToggleUnclear(key);
                    onChange(key, "");
                  } else {
                    onToggleUnclear(key);
                    onChange(key, UNCLEAR_TEXT);
                  }
                }}
              >
                {V5_COPY.comprehend.unclear}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn("rounded-full", privateChosen && "border-primary bg-primary/10 text-primary")}
                onClick={() => {
                  const key = current.key as DimensionKey;
                  if (unclear) onToggleUnclear(key);
                  onChange(key, privateChosen ? "" : PRIVATE_TEXT);
                }}
              >
                {V5_COPY.comprehend.skip}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={onClear}
              >
                {V5_COPY.comprehend.clear}
              </Button>
            </div>
          </div>

          <Accordion
            type="single"
            collapsible
            className="rounded-2xl border border-border/70 px-4"
          >
            <AccordionItem value="why" className="border-none">
              <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                <span className="flex items-center gap-2">
                  <HelpCircle aria-hidden className="h-4 w-4 text-primary" />
                  {V5_COPY.comprehend.whyLabel}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {current.why}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => (index === 0 ? onBack() : setIndex(index - 1))}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {index === 0 ? "Voltar" : V5_COPY.comprehend.prev}
            </Button>
            <Button onClick={() => (isLast ? onNext() : setIndex(index + 1))}>
              {isLast ? "Continuar para regular" : V5_COPY.comprehend.next}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>}
    </div>
  );
};
