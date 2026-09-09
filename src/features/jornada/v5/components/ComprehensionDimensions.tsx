import { useState } from "react";
import { ArrowLeft, ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

type DimensionKey = "situation" | "body" | "behavior" | "thoughts";

/** Panorama do momento: quatro dimensões, uma por vez, com saídas explícitas. */
export const ComprehensionDimensions = ({
  value,
  focusLabel,
  onChange,
  onToggleUnclear,
  onSkip,
  onClear,
  onBack,
  onNext,
}: {
  value: ComprehensionState;
  focusLabel: string;
  onChange: (key: DimensionKey, text: string) => void;
  onToggleUnclear: (key: string) => void;
  onSkip: () => void;
  onClear: () => void;
  onBack: () => void;
  onNext: () => void;
}) => {
  const [index, setIndex] = useState(0);
  const dimensions = V5_COPY.comprehend.dimensions;
  const current = dimensions[index];
  const isLast = index === dimensions.length - 1;
  const unclear = value.unclear.includes(current.key);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="space-y-6 p-5 sm:p-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {V5_COPY.comprehend.eyebrow}
          </p>
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            {V5_COPY.comprehend.title}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {V5_COPY.comprehend.description}
          </p>
          <p className="text-sm text-muted-foreground">
            Foco desta reflexão: <strong className="text-foreground">{focusLabel}</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {dimensions.map((dimension, i) => {
            const filled = !!value[dimension.key as DimensionKey] || value.unclear.includes(dimension.key);
            return (
              <button
                key={dimension.key}
                type="button"
                onClick={() => setIndex(i)}
                aria-current={i === index ? "step" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  i === index
                    ? "bg-primary text-primary-foreground"
                    : filled
                      ? "bg-primary/15 text-primary"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                )}
              >
                {i + 1}. {dimension.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/25 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-foreground">{current.question}</h3>
            <Badge variant="secondary" className="rounded-full text-xs font-normal">
              {index + 1} de {dimensions.length}
            </Badge>
          </div>

          <Textarea
            value={value[current.key as DimensionKey]}
            onChange={(event) => onChange(current.key as DimensionKey, event.target.value)}
            placeholder={current.placeholder}
            rows={4}
            disabled={unclear}
            className="resize-none bg-card"
          />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={unclear ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleUnclear(current.key)}
            >
              {V5_COPY.comprehend.unclear}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onSkip}>
              {V5_COPY.comprehend.skip}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>
              {V5_COPY.comprehend.clear}
            </Button>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="why" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
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
        </div>

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
    </Card>
  );
};
