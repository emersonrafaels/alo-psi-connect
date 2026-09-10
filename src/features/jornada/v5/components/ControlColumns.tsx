import { ArrowLeft, CircleDot, HelpCircle, Minus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { V5_COPY } from "../copy";
import type { ActionState, ActionStatus, ActionWhen } from "../types";

const ICONS = { direct: CircleDot, influence: Users, none: Minus } as const;

/** Fase Agir: três áreas de controle + menor próximo passo possível. */
export const ControlColumns = ({
  value,
  onChange,
  onWhen,
  onStatus,
  onBack,
  onFinish,
}: {
  value: ActionState;
  onChange: (key: "direct" | "influence" | "none" | "next", text: string) => void;
  onWhen: (when: ActionWhen) => void;
  onStatus: (status: ActionStatus) => void;
  onBack: () => void;
  onFinish: () => void;
}) => (
  <Card className="border-border/70 shadow-sm">
    <CardContent className="space-y-6 p-5 sm:p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {V5_COPY.act.eyebrow}
        </p>
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">{V5_COPY.act.title}</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">{V5_COPY.act.description}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {V5_COPY.act.columns.map((column) => {
          const Icon = ICONS[column.key as keyof typeof ICONS];
          return (
            <div
              key={column.key}
              className="space-y-3 rounded-2xl border border-border/70 bg-muted/25 p-4"
            >
              <div className="flex items-center gap-2">
                <Icon aria-hidden className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground">{column.description}</p>
              <Textarea
                value={value[column.key as "direct" | "influence" | "none"]}
                onChange={(event) =>
                  onChange(column.key as "direct" | "influence" | "none", event.target.value)
                }
                rows={4}
                placeholder={column.placeholder}
                className="resize-none bg-card"
              />
            </div>
          );
        })}
      </div>

      <Accordion type="single" collapsible className="rounded-2xl border border-border/70 px-4">
        <AccordionItem value="guilt" className="border-none">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <span className="flex items-center gap-2">
              <HelpCircle aria-hidden className="h-4 w-4 text-primary" />
              {V5_COPY.act.guiltQuestion}
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            {V5_COPY.act.guiltAnswer}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="space-y-4 rounded-2xl border border-primary/25 bg-primary/5 p-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{V5_COPY.act.stepTitle}</h3>
          <p className="text-xs text-muted-foreground">{V5_COPY.act.stepNote}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <Input
            value={value.next}
            onChange={(event) => onChange("next", event.target.value)}
            placeholder={V5_COPY.act.stepPlaceholder}
            aria-label={V5_COPY.act.stepTitle}
            className="bg-card"
          />
          <Select
            value={value.when ?? ""}
            onValueChange={(next) => onWhen(next as ActionWhen)}
          >
            <SelectTrigger className="bg-card" aria-label={V5_COPY.act.whenLabel}>
              <SelectValue placeholder={V5_COPY.act.whenLabel} />
            </SelectTrigger>
            <SelectContent>
              {V5_COPY.act.whenOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          {V5_COPY.act.statusOptions.map((option) => (
            <Button
              key={option.id}
              size="sm"
              variant="outline"
              className={cn(
                "rounded-full",
                value.status === option.id && "border-primary bg-primary/10 text-primary"
              )}
              onClick={() => onStatus(option.id as ActionStatus)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {V5_COPY.act.back}
        </Button>
        <Button onClick={onFinish}>{V5_COPY.act.finish}</Button>
      </div>
    </CardContent>
  </Card>
);
