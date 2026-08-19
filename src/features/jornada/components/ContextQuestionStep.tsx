import { cn } from "@/lib/utils";
import type { ContextQuestion } from "../domain/types";

export const ContextQuestionStep = ({
  question,
  value,
  onAnswer,
}: {
  question: ContextQuestion;
  value: string | null;
  onAnswer: (optionId: string) => void;
}) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-foreground">{question.question}</h3>
    <div className="grid gap-2 sm:grid-cols-2">
      {question.options.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onAnswer(option.id)}
            aria-pressed={selected}
            className={cn(
              "rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-all",
              selected
                ? "border-primary bg-primary/10 text-foreground shadow-sm"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/40"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  </div>
);
